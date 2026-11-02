---
title: "文字列を JSON の形にエスケープして書き出す"
description: "Google Gson の JsonWriter.string(String)。128 要素の表で制御文字と引用符を変換し、変換の必要がない部分はまとめて書き出す。HTML 安全モードも同じ表の変形で扱う。"
language: java
project: Gson
repo: https://github.com/google/gson
license: Apache-2.0
copyright: "Copyright (C) 2010 Google Inc."
commit: "57731049da3e415be3d5d34db1ca3b80f3c73810"
file: gson/src/main/java/com/google/gson/stream/JsonWriter.java
lines: [743, 773]
function: "JsonWriter.string"
difficulty: 2
format: 2
tags: [文字列処理, 入出力, 最適化]
---

## ひとことで

`JsonWriter.string(value)` は、文字列を JSON の文字列として書き出すメソッドです。ダブルクォートや改行などの特別な文字を、`\"` や `\n` のような形に置き換えます。

Gson は、JSON を書き出すときにこのメソッドを使います。文字列の中の特別な文字だけを置き換え、それ以外の部分は、そのまま一度に書き出します。

## コード

```java:line-numbers=743
  private void string(String value) throws IOException {
    String[] replacements = htmlSafe ? HTML_SAFE_REPLACEMENT_CHARS : REPLACEMENT_CHARS;
    out.write('\"');
    int last = 0;
    int length = value.length();
    for (int i = 0; i < length; i++) {
      char c = value.charAt(i);
      String replacement;
      if (c < 128) {
        replacement = replacements[c];
        if (replacement == null) {
          continue;
        }
      } else if (c == '\u2028') {
        replacement = "\\u2028";
      } else if (c == '\u2029') {
        replacement = "\\u2029";
      } else {
        continue;
      }
      if (last < i) {
        out.write(value, last, i - last);
      }
      out.write(replacement);
      last = i + 1;
    }
    if (last < length) {
      out.write(value, last, length - last);
    }
    out.write('\"');
  }
```

## 前提知識

- **JSON の文字列**: ダブルクォートで囲みます。中に `"` や `\`、改行などを、そのまま書けません。`\"` や `\\`、`\n` のように、`\` を付けて書きます。
- **制御文字**: 0x00 から 0x1F までの文字です。画面に表示されない文字が多く、JSON では `\u0001` のように書くのが決まりです。
- **表（テーブル）**: 文字コードを添字にした配列です。`REPLACEMENT_CHARS[c]` のように、文字をそのまま番号として引けます。
- **`Writer`（`out`）**: 文字を書き出す先です。`write(value, from, len)` で、文字列の一部をまとめて書けます。
- **HTML 安全モード**: `<` や `&` などを `<` のように変換して、HTML に埋め込んでも安全にする設定です。

## 何をしているか

### 1. 128 個の表を作る

```java:line-numbers=182
    REPLACEMENT_CHARS = new String[128];
    for (int i = 0; i <= 0x1f; i++) {
      REPLACEMENT_CHARS[i] = String.format("\\u%04x", i);
    }
```

`REPLACEMENT_CHARS` は、ASCII の 128 文字に対応する配列です。制御文字は、全部 `\u0000` の形に置き換えます。`"` や `\`、`\t`、`\n` などは、よく使うので、1 文字ずつ別の表記を入れています。

```java:line-numbers=193
    HTML_SAFE_REPLACEMENT_CHARS = REPLACEMENT_CHARS.clone();
    HTML_SAFE_REPLACEMENT_CHARS['<'] = "\\u003c";
    HTML_SAFE_REPLACEMENT_CHARS['>'] = "\\u003e";
    HTML_SAFE_REPLACEMENT_CHARS['&'] = "\\u0026";
    HTML_SAFE_REPLACEMENT_CHARS['='] = "\\u003d";
    HTML_SAFE_REPLACEMENT_CHARS['\''] = "\\u0027";
```

HTML 安全モードの表は、通常の表を複製し、`<`、`>`、`&`、`=`、`'` だけを `<` などに変えたものです。

### 2. 1 文字ずつ見て、置き換えが必要か決める

```java:line-numbers=745
    out.write('\"');
    int last = 0;
    int length = value.length();
    for (int i = 0; i < length; i++) {
      char c = value.charAt(i);
      String replacement;
      if (c < 128) {
        replacement = replacements[c];
        if (replacement == null) {
          continue;
        }
      } else if (c == '\u2028') {
        replacement = "\\u2028";
      } else if (c == '\u2029') {
        replacement = "\\u2029";
      } else {
        continue;
      }
```

`value` を 1 文字ずつ見ます。128 未満の文字は表を引き、表の値が `null` なら、置き換えの必要がない文字なので `continue` で次へ進みます。128 以上では、U+2028 と U+2029 だけをエスケープします。これらは、JavaScript では行の区切りとして扱われるため、JSON の中では置き換えておく必要があるからです。

### 3. 置き換えが必要な文字の前までを、まとめて書く

```java:line-numbers=763
      if (last < i) {
        out.write(value, last, i - last);
      }
      out.write(replacement);
      last = i + 1;
    }
    if (last < length) {
      out.write(value, last, length - last);
    }
    out.write('\"');
```

`last` は、まだ書いていない位置を表します。置き換えが必要な文字 `i` を見つけたら、`last` から `i` の直前までを、まとめて `write` します。その後、置き換えた文字列を書き、`last` を `i + 1` に進めます。最後に、残りの部分を書きます。

## ここがすごい

- **変換しない部分はまとめて書く**: 1 文字ずつ書き出すのではなく、変換の必要がある位置だけで区切って書きます。書き出しの回数を減らせます。
- **表の引きで判定する**: 文字ごとの判定を、配列の添字の参照だけで行います。大量の `if` の連鎖がありません。
- **HTML 安全モードは表を複製するだけ**: 表の一部を書き換えたものを別に持つので、モードの切り替えは、使う表を選ぶだけで済みます。
- **U+2028 と U+2029 を扱う**: 普通の文字の範囲外にあるこの 2 文字を、別に扱っています。JavaScript の環境で JSON を読むときの問題を防ぐための処理です。

## まとめ

- `string` は、文字列を 1 文字ずつ見て、置き換えが必要な位置だけを区切って書き出す。
- 置き換えは、128 要素の表を引いて決める。HTML 安全モードでは、同じ表の一部を変えたものを使う。
- U+2028 と U+2029 は、表の外で別に置き換える。
