package com.example.demo

import java.util.*


object CookieUtils {
    fun concatCookies(cookieStrings: Collection<String>): String {
        val cookieSet: MutableSet<String> = HashSet()
        for (cookies in cookieStrings) {
            cookieSet.addAll(splitCookies(cookies))
        }
        return join("; ", cookieSet.toTypedArray()).trim()
    }

    fun splitCookies(cookies: String): Set<String> {
        return HashSet(Arrays.asList(*cookies.split("; *".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()))
    }


//    /**
//     * Method for joining an array of int.
//     * The values will be joined by ',' (comma).
//     *
//     * @param tokens    the values
//     * @return A formatted string
//     */
//    fun join(tokens: IntArray): String {
//        return join(",", tokens)
//    }
//
//    /**
//     * Method for joining an array of int
//     *
//     * @param delimiter A string to join the int's by
//     * @param tokens    the values
//     * @return A formatted string
//     */
//    fun join(delimiter: CharSequence?, tokens: IntArray): String {
//        val sb = StringBuilder()
//        for (token in tokens) {
//            if (sb.length != 0) {
//                sb.append(delimiter)
//            }
//            sb.append(token)
//        }
//        return sb.toString()
//    }
//
//    /**
//     * Method for joining an array of float
//     * The values will be joined by ',' (comma).
//     *
//     * @param tokens    the values
//     * @return A formatted string
//     */
//    fun join(tokens: FloatArray): String {
//        return join(",", tokens)
//    }

//    /**
//     * Method for joining an array of float
//     *
//     * @param delimiter A CharSequence to join the `tokens` by
//     * @param tokens    the values
//     * @return A formatted string
//     */
//    fun join(delimiter: CharSequence?, tokens: FloatArray): String {
//        val sb = StringBuilder()
//        for (token in tokens) {
//            if (sb.length != 0) {
//                sb.append(delimiter)
//            }
//            sb.append(token)
//        }
//        return sb.toString()
//    }

    /**
     * Returns a string containing the tokens joined by delimiters.
     *
     * @param delimiter A CharSequence to join the `tokens` by
     * @param tokens an array objects to be joined. Strings will be formed from
     * the objects by calling object.toString().
     * @return A string of the joined items
     */
    fun join(delimiter: CharSequence?, tokens: Array<Any?>?): String {
        return tokens!!.toList().joinToString(separator = ", ")
    }


    /**
     * Converts a string into it's camel case equivalent. But only if the String is all upper case.<br></br>
     * An example with 'space' (" ") as split:
     *
     *  * "AN EXAMPLE STRING" - "An Example String"
     *  * "AN EXampLE STRING" - "AN EXampLE STRING"
     *
     *
     * @param word A string to convert
     * @param splitChar  The regular expression to split the string on
     * @return A String
     */
    fun toCamelCaseIfAllUppercase(word: String, splitChar: String?): String {
        if (isEmpty(word)) {
            return word
        }

        return if (word.uppercase(Locale.getDefault()) == word) {
            toCamelCase(word, splitChar)
        } else {
            word
        }
    }

    /**
     * Converts a string into it's camel case equivalent.<br></br>
     * An example with 'space' (" ") as split: "an example string" - "An Example String".
     *
     * @param word  A string to convert
     * @param split The regular expression to split the string on
     * @return A new String in camel case
     */
    fun toCamelCase(word: String, split: String?): String {
        var split = split
        if (isEmpty(word)) {
            return word
        }

        split = (split ?: " ")

        val sb = StringBuilder(word.length)
        for (s in word.split(split.toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()) {
            if (sb.length > 0) {
                sb.append(split)
            }
            sb.append(toCamelCase(s))
        }
        return sb.toString()
    }

    /**
     * Convert a string (one word, no splitting), so the first Character is upper case,
     * and the rest (if any) is in lower case.
     *
     * @param word To convert
     * @return A new String with capitalized first letter, and the rest in lower case
     */
    fun toCamelCase(word: String): String {
        if (isEmpty(word)) {
            return word
        }

        val first = word[0].uppercaseChar()
        return if (word.length == 1) {
            first.toString()
        } else {
            first.toString() + word.substring(1).lowercase(Locale.getDefault())
        }
    }

    /**
     * Returns true if the string is null or 0-length.
     * @param str the string to be examined
     * @return true if str is null or zero length
     */
    fun isEmpty(str: CharSequence?): Boolean {
        return (str == null || str.length == 0)
    }
}