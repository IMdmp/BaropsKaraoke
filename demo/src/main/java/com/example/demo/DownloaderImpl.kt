package com.example.demo


import com.example.demo.CookieUtils.concatCookies
import org.schabi.newpipe.extractor.downloader.Downloader;
import org.schabi.newpipe.extractor.downloader.Request;
import org.schabi.newpipe.extractor.downloader.Response;
import org.schabi.newpipe.extractor.exceptions.ReCaptchaException;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import okhttp3.CipherSuite;
import okhttp3.CipherSuite.Companion.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
import okhttp3.CipherSuite.Companion.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
import okhttp3.ConnectionSpec;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

class DownloaderImpl private constructor(builder: OkHttpClient.Builder) : Downloader() {
    private val mCookies: MutableMap<String, String>
    private val client: OkHttpClient

    init {
        enableModernTLS(builder)

        this.client = builder
            .readTimeout(
                30,
                TimeUnit.SECONDS
            ) //                .cache(new Cache(new File(context.getExternalCacheDir(), "okhttp"),
            //                        16 * 1024 * 1024))
            .build()
        this.mCookies = HashMap()
    }

    fun getCookies(url: String): String {
        val resultCookies: MutableList<String> = ArrayList()
        if (url.contains(YOUTUBE_DOMAIN)) {
            val youtubeCookie = getCookie(YOUTUBE_RESTRICTED_MODE_COOKIE_KEY)
            if (youtubeCookie != null) {
                resultCookies.add(youtubeCookie)
            }
        }
        // Recaptcha cookie is always added TODO: not sure if this is necessary
        val recaptchaCookie = getCookie(RECAPTCHA_COOKIES_KEY)
        if (recaptchaCookie != null) {
            resultCookies.add(recaptchaCookie)
        }
        return concatCookies(resultCookies)
    }

    fun getCookie(key: String): String? {
        return mCookies[key]
    }

    fun setCookie(key: String, cookie: String) {
        mCookies[key] = cookie
    }

    fun removeCookie(key: String) {
        mCookies.remove(key)
    }

    fun updateYoutubeRestrictedModeCookies(youtubeRestrictedModeEnabled: Boolean) {
        if (youtubeRestrictedModeEnabled) {
            setCookie(
                YOUTUBE_RESTRICTED_MODE_COOKIE_KEY,
                YOUTUBE_RESTRICTED_MODE_COOKIE
            )
        } else {
            removeCookie(YOUTUBE_RESTRICTED_MODE_COOKIE_KEY)
        }
        //        InfoCache.getInstance().clearCache();
    }

    /**
     * Get the size of the content that the url is pointing by firing a HEAD request.
     *
     * @param url an url pointing to the content
     * @return the size of the content, in bytes
     */
    @Throws(IOException::class)
    fun getContentLength(url: String?): Long {
        try {
            val response = head(url)
            return response.getHeader("Content-Length")!!.toLong()
        } catch (e: NumberFormatException) {
            throw IOException("Invalid content length", e)
        } catch (e: ReCaptchaException) {
            throw IOException(e)
        }
    }

    @Throws(IOException::class, ReCaptchaException::class)
    override fun execute(@NonNull request: Request): Response {
        val httpMethod = request.httpMethod()
        val url = request.url()
        val headers = request.headers()
        val dataToSend = request.dataToSend()

        var requestBody: RequestBody? = null
        if (dataToSend != null) {
            requestBody = RequestBody.create(null, dataToSend)
        }

        val requestBuilder: okhttp3.Request.Builder = okhttp3.Request.Builder()
            .method(httpMethod, requestBody).url(url)
            .addHeader("User-Agent", USER_AGENT)

        val cookies = getCookies(url)
        if (!cookies.isEmpty()) {
            requestBuilder.addHeader("Cookie", cookies)
        }

        for ((headerName, headerValueList) in headers) {
            if (headerValueList.size > 1) {
                requestBuilder.removeHeader(headerName)
                for (headerValue in headerValueList) {
                    requestBuilder.addHeader(headerName, headerValue)
                }
            } else if (headerValueList.size == 1) {
                requestBuilder.header(headerName, headerValueList[0])
            }
        }

        val response = client.newCall(requestBuilder.build()).execute()

        if (response.code == 429) {
            response.close()

            throw ReCaptchaException("reCaptcha Challenge requested", url)
        }

        val body = response.body
        var responseBodyToReturn: String? = null

        if (body != null) {
            responseBodyToReturn = body.string()
        }

        val latestUrl = response.request.url.toString()
        return Response(
            response.code, response.message, response.headers.toMultimap(),
            responseBodyToReturn, latestUrl
        )
    }

    companion object {
        const val RECAPTCHA_COOKIES_KEY: String = "recaptcha_cookies"

        const val USER_AGENT
                : String = "Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0"
        const val YOUTUBE_RESTRICTED_MODE_COOKIE_KEY
                : String = "youtube_restricted_mode_key"
        const val YOUTUBE_RESTRICTED_MODE_COOKIE: String = "PREF=f2=8000000"
        const val YOUTUBE_DOMAIN: String = "youtube.com"

        var instance: DownloaderImpl? = null
            private set

        /**
         * It's recommended to call exactly once in the entire lifetime of the application.
         *
         * @param builder if null, default builder will be used
         * @return a new instance of [DownloaderImpl]
         */
        fun init(@Nullable builder: OkHttpClient.Builder?): DownloaderImpl {
            instance = DownloaderImpl(
                if (builder != null) builder else OkHttpClient.Builder()
            )
            return instance!!
        }

        /**
         * Enable TLS 1.2 and 1.1 on Android Kitkat. This function is mostly taken
         * from the documentation of OkHttpClient.Builder.sslSocketFactory(_,_).
         *
         *
         * If there is an error, the function will safely fall back to doing nothing
         * and printing the error to the console.
         *
         *
         * @param builder The HTTPClient Builder on which TLS is enabled on (will be modified in-place)
         */
        private fun enableModernTLS(builder: OkHttpClient.Builder) {
            try {
                // get the default TrustManager
                val trustManagerFactory = TrustManagerFactory.getInstance(
                    TrustManagerFactory.getDefaultAlgorithm()
                )
                trustManagerFactory.init(null as KeyStore?)
                val trustManagers = trustManagerFactory.trustManagers
                check(!(trustManagers.size != 1 || trustManagers[0] !is X509TrustManager)) {
                    ("Unexpected default trust managers:"
                            + trustManagers.contentToString())
                }
                val trustManager = trustManagers[0] as X509TrustManager

                // insert our own TLSSocketFactory
                val sslSocketFactory: SSLSocketFactory = TLSSocketFactoryCompat.getInstance()

                builder.sslSocketFactory(sslSocketFactory, trustManager)

                // This will try to enable all modern CipherSuites(+2 more)
                // that are supported on the device.
                // Necessary because some servers (e.g. Framatube.org)
                // don't support the old cipher suites.
                // https://github.com/square/okhttp/issues/4053#issuecomment-402579554
                val cipherSuites: MutableList<CipherSuite> =
                    ArrayList(ConnectionSpec.MODERN_TLS.cipherSuites)
                cipherSuites.add(TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA)
                cipherSuites.add(TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA)
                val legacyTLS: ConnectionSpec = ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
                    .cipherSuites(*cipherSuites.toTypedArray<CipherSuite>())
                    .build()

                builder.connectionSpecs(Arrays.asList(legacyTLS, ConnectionSpec.CLEARTEXT))
            } catch (e: KeyManagementException) {
//            if (BuildConfig.DEBUG) {
//                e.printStackTrace();
//            }
            } catch (e: NoSuchAlgorithmException) {
            } catch (e: KeyStoreException) {
            }
        }
    }
}