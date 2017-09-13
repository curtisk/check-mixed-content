#!/usr/bin/env node
'use strict';
const Crawler = require('easycrawler')
const cheerio = require('cheerio')
const argv = require('yargs').argv

let url = argv.url
let thread = argv.thread || 1
let depth = argv.depth || 3
let debug = argv.debug

if (argv.url.indexOf('https:') == -1) url = 'https://' + url
let goodCount = 0, badCount = 0, activeCount = 0
let crawler = new Crawler({
    thread: thread,
    logs: debug,
    depth: depth,
    headers: {'user-agent': 'foobar'},
    onlyCrawl: [url], //will only crawl urls containing these strings
    //reject : ['rutube'], //will reject links containing rutube
    onSuccess: function (data) {
        let bad = false
        let active = false
        let problemResources = ''
        let $ = cheerio.load(data.body)
        $('img').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            } 
            if ($(this).attr('srcset') && $(this).attr('srcset').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('srcset')+ '\n'
            }
        })
        $('iframe').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            }
        })
        $('script').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            }
        })
        $('object').each(function () {
            if ($(this).attr('data') && $(this).attr('data').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('data')+ '\n'
            }
        })
        $('form').each(function () {
            if ($(this).attr('action') && $(this).attr('action').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('action')+ '\n'
            } 
        })
        $('embed').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            }
        })
        $('video').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            } 
        })
        $('audio').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            } 
        })
        $('source').each(function () {
            if ($(this).attr('src') && $(this).attr('src').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('src')+ '\n'
            } 
            if ($(this).attr('srcset') && $(this).attr('srcset').indexOf('http:') > -1){
                bad =  true
                problemResources += '\t' + $(this).attr('srcset')+ '\n'
            } 
        })
        $('param').each(function () {
            if ($(this).attr('value') && $(this).attr('value').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('value')+ '\n'
            }
        })
        $('link').each(function () {
            if ($(this).attr('href') && $(this).attr('href').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('href')+ '\n'
            }
            if ($(this).attr('rel') && $(this).attr('rel').indexOf('http:') > -1){
                active = true
                problemResources += '\t' + $(this).attr('rel')+ '\n'
            }
        })
        if (active || bad) {
            if (active) {
                console.log(`===> ${data.url} has active mixed content!`)
                activeCount++
            }
            else {
                console.log(`===> ${data.url} has mixed content!`)
                badCount++
            }
            // badCount++
            console.log('\t These are the references that need to be addressed in this file: \n' + problemResources)
        }
        else {
            console.log(`${data.url} is good!`)
            goodCount++
        }
    },
    onError: function (data) {
        console.log(data.url)
        console.log(data.status)
    },
    onFinished: function (urls) {
        console.log(`\nCrawled ${urls.crawled.length} pages`)
        console.log(`${goodCount} pages are good`)
        console.log(`${activeCount} pages have active mixed HTTP/HTTPS content`)
        console.log(`${badCount} pages have mixed HTTP/HTTPS content`)
        if (debug) {
            console.log(urls.discovered)
            console.log(urls.crawled)
        }
        if (badCount) {
            process.exitCode = 1
        }
    }
})
crawler.crawl(url)
