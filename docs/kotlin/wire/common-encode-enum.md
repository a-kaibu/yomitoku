---
title: "Protocol Buffers の enum を、数値の varint として書き出す"
description: "Protocol Buffers の enum の値を、整数の可変長表現（varint）で書き出す commonEncode。書き出し先が前向きの ProtoWriter でも、後ろ向きの ReverseProtoWriter でも同じ形で書ける。"
language: kotlin
project: "Wire"
repo: https://github.com/square/wire
license: Apache-2.0
copyright: "Copyright (C) 2016 Square, Inc."
commit: "8182e8d58173a9e3a3fd9d81a36864a9d2e42754"
file: wire-runtime/src/commonMain/kotlin/com/squareup/wire/EnumAdapter.kt
lines: [51, 53]
function: "commonEncode"
difficulty: 2
tags: [低レイヤ, 型システム, 最適化]
format: 2
---

## ひとことで

`commonEncode` は、Wire が生成する **Protocol Buffers の enum の値を、バイナリの形に書き出す** 関数です。enum の値は、内部では整数の番号（`value`）として持たれています。その整数を、可変長の整数（varint）の形で書き込みます。

Protocol Buffers は、データを小さなバイナリにまとめる形式です。Wire は、その形式の読み書きを Kotlin で行うライブラリで、この関数は enum の書き出し部分にあたります。

## コード

```kotlin:line-numbers=51
internal inline fun <E : WireEnum> commonEncode(writer: ProtoWriter, value: E) {
  writer.writeVarint32(value.value)
}
```

## 前提知識

- **Protocol Buffers（protobuf）**: データの形を `.proto` ファイルに書き、そこからバイナリの読み書きのコードを作る仕組みです。小さく速いのが特徴です。
- **enum の番号**: protobuf の enum は、名前ではなく整数の番号で表されます。`WireEnum` を実装した型は、その番号を `value` で持ちます。
- **varint（可変長整数）**: 小さい数ほど少ないバイト数で書ける整数の表し方です。7 ビットずつ区切って、最後のバイトだけ先頭のビットを 0 にします。
- **`ProtoWriter` と `ReverseProtoWriter`**: どちらも、バイナリを書き出すための道具です。`ProtoWriter` は先頭から順に書き、`ReverseProtoWriter` は末尾から逆向きに書きます。
- **`inline` と `reified`**: `inline` 関数は、呼び出し先のコードに展開されます。ここでは、`<E : WireEnum>` の型が、コンパイル時に決まった形で使われます。
- **`@Suppress("NOTHING_TO_INLINE")`**: 中身が短いので、`inline` にしても効果が薄いという警告を黙らせる印です。

## 何をしているか

### 1. 先頭から書く場合

```kotlin:line-numbers=51
internal inline fun <E : WireEnum> commonEncode(writer: ProtoWriter, value: E) {
  writer.writeVarint32(value.value)
}
```

`ProtoWriter` に対して、enum の番号を varint の 32 ビット整数として書き込みます。`value.value` は、enum の持つ整数の番号です。

### 2. 末尾から書く場合

```kotlin:line-numbers=56
internal inline fun <E : WireEnum> commonEncode(writer: ReverseProtoWriter, value: E) {
  writer.writeVarint32(value.value)
}
```

同じ処理を、`ReverseProtoWriter` に対しても用意しています。中身は同じ 1 行で、書く向きだけが違います。

## ここがすごい

- **同じ形を、書く向きごとに用意する**: 2 種類の書き出し先に対して、関数の名前を同じにして、引数の型で振り分けています。呼び出す側は、どちらの書き出し先でも同じ名前で書けます。
- **`inline` で関数呼び出しを減らす**: 小さな関数を `inline` にすると、呼び出しのたびに別の関数を経由せず、中身が直接埋め込まれます。データを大量に読み書きするときに効きます。
- **enum を整数として扱う**: enum の名前は書き出さず、番号だけを書きます。データが小さくなり、名前の変更にも影響されません。
- **サイズを計算する関数と対になる**: 同じファイルには、書き出すバイト数を求める関数もあります。書く前に大きさを知れるので、バッファの確保などに役立ちます。

## まとめ

- Protocol Buffers の enum は、名前ではなく整数の番号として書き出す。
- 書き出し先の向きごとに同じ名前の関数を用意すると、呼び出し側が簡潔になる。
- 小さな関数は `inline` にすると、大量のデータを扱うときの無駄な呼び出しを減らせる。
