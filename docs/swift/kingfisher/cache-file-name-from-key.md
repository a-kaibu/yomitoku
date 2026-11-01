---
title: "キャッシュのキーを、安全なファイル名に変える"
description: "画像のキャッシュを保存するとき、URL などのキーを、そのままではなく SHA-256 のハッシュ名に変えるかを決める関数。拡張子は設定か、元のキーから決める。"
language: swift
project: "Kingfisher"
repo: https://github.com/onevcat/Kingfisher
license: MIT
copyright: "Copyright (c) 2019 Wei Wang <onevcat@gmail.com>"
commit: "7406a99571034568b6ca4ba875c01842607e03d9"
file: Sources/Cache/DiskStorage.swift
lines: [390, 410]
function: "DiskStorage.cacheFileName(forKey:forcedExtension:)"
difficulty: 2
tags: [文字列処理, ハッシュ, ファイル]
format: 2
---
## ひとことで

Kingfisher は、ダウンロードした画像を、ディスクにファイルとして保存します。そのときのファイル名は、キー（多くは画像の URL）から作ります。
URL には `/` や `:` や `?` が含まれ、そのままではファイル名として使えません。そこで、設定によって、キーを **SHA-256 のハッシュ値** に変えてから、ファイル名にします。この関数は、その名前と拡張子を決めます。

## コード

```swift:line-numbers=390
        func cacheFileName(forKey key: String, forcedExtension: String? = nil) -> String {
            let baseName = config.usesHashedFileName ? key.kf.sha256 : key
            
            if let ext = fileExtension(key: key, forcedExtension: forcedExtension) {
                return "\(baseName).\(ext)"
            }
            
            return baseName
        }
        
        func fileExtension(key: String, forcedExtension: String?) -> String? {
            if let ext = forcedExtension ?? config.pathExtension {
                return ext
            }
        
            if config.usesHashedFileName && config.autoExtAfterHashedFileName {
                return key.kf.ext
            }
        
            return nil
        }
```

## 前提知識

- **ハッシュ値（SHA-256）**: 任意の長さの文字列から作る、固定の長さの値です。同じ入力からは、いつも同じ値が出ます。元に戻すことはできません。
- **拡張子**: ファイル名の最後の `.png` などの部分です。画像の種類を示すのに使います。
- **`appendingPathComponent`**: ディレクトリの URL に、ファイル名を付け足す関数です（この関数の後に使われます）。

## 何をしているか

### 1. 基本の名前を、キーかハッシュ値にする

設定で `usesHashedFileName` が有効なら、キーの SHA-256 を名前にします。無効なら、キーをそのまま使います。

```swift:line-numbers=391
            let baseName = config.usesHashedFileName ? key.kf.sha256 : key
```
### 2. 拡張子があれば、名前の後ろに付ける

拡張子が決まれば、`名前.拡張子` の形にします。決まらなければ、名前だけを返します。

```swift:line-numbers=393
            if let ext = fileExtension(key: key, forcedExtension: forcedExtension) {
                return "\(baseName).\(ext)"
            }
            
            return baseName
```
### 3. 拡張子は、設定か、元のキーから決める

まず、強制する拡張子か、設定された拡張子を使います。なければ、ハッシュ化しているときに限り、元のキーから拡張子を取り出します。どちらもなければ、拡張子はありません。

```swift:line-numbers=400
        func fileExtension(key: String, forcedExtension: String?) -> String? {
            if let ext = forcedExtension ?? config.pathExtension {
                return ext
            }
        
            if config.usesHashedFileName && config.autoExtAfterHashedFileName {
                return key.kf.ext
            }
        
            return nil
```
## ここがすごい

- **ファイル名の安全性を、ハッシュで確保する**: ハッシュ値は英数字だけの固定長です。キーに含まれる記号や、長すぎる URL を気にせず、ファイル名にできます。
- **拡張子は、名前とは別に決める**: 名前はハッシュで決めても、拡張子は元のキーから引き継げます。画像の種類を、ファイルを開かずに分かるようにしています。
- **優先順位がはっきりしている**: 強制した拡張子、設定の拡張子、元のキーの拡張子の順に決めます。どこから来た値か、読めば分かります。

## まとめ

- キャッシュのファイル名は、キーをそのまま使うか、SHA-256 のハッシュ値にするかで決まる。
- 拡張子は、強制、設定、元のキーの順で決める。
- ハッシュにすると、記号や長さの問題を避けられる。
