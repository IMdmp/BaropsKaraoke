package com.example.demo

import okhttp3.OkHttpClient
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.NewPipe.getPreferredLocalization
import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.localization.ContentCountry
import org.schabi.newpipe.extractor.search.SearchInfo
import org.schabi.newpipe.extractor.services.youtube.YoutubeService
import org.schabi.newpipe.extractor.services.youtube.extractors.YoutubeSearchExtractor
import org.schabi.newpipe.extractor.services.youtube.linkHandler.YoutubeSearchQueryHandlerFactory
import org.schabi.newpipe.extractor.stream.StreamInfoItem
import org.schabi.newpipe.extractor.stream.StreamType
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.*

@SpringBootApplication
@RestController
class DemoApplication {

    @GetMapping("/")
    fun hello(): String {
        return "Hello, World2!"
    }
    @CrossOrigin(origins = ["http://localhost:3000"])
    @GetMapping("/search")
    fun search(@RequestParam query: String): List<SearchData> {
        val factory = YoutubeSearchQueryHandlerFactory().fromQuery(query)

        val service = YoutubeService(0)
//        val extractor = YoutubeSearchExtractor(service, factory)

        val relatedItems = SearchInfo.getInfo(service, factory).relatedItems.take(10)
        val results = relatedItems.mapNotNull {
            if (it is StreamInfoItem) {
                if (it.streamType == StreamType.VIDEO_STREAM) {
                    if (it.thumbnails.isNotEmpty())
                        SearchData(it.name, it.url, it.thumbnails.first().url) else null
                } else {
                    null
                }
            } else {
                null
            }
        }

        return results
    }

    data class SearchData(val title: String, val url: String, val thumbnailUrl: String)
}

private fun getDownloader(
    okhttpBuilder: OkHttpClient.Builder,
): Downloader {
    val downloader = DownloaderImpl.init(okhttpBuilder)
    setCookiesToDownloader(downloader, "sampleCaptchaKey")
    return downloader
}

private fun setCookiesToDownloader(
    downloader: DownloaderImpl,
    captchaKey: String
) {
    downloader.setCookie(
        DownloaderImpl.RECAPTCHA_COOKIES_KEY,
        captchaKey
    )
}

fun main(args: Array<String>) {

    val country = ContentCountry(Locale.getDefault().country)
    val locale = getPreferredLocalization()
    NewPipe.init(
        getDownloader(OkHttpClient.Builder()),
        locale,
        country
    )
    runApplication<DemoApplication>(*args)
}
