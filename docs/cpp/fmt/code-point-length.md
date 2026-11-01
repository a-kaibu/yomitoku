---
title: 64 ビットの定数 1 個に UTF-8 の長さ表を詰め込む
description: UTF-8 の先頭バイトから、その文字が何バイトかを返す関数。先頭 5 ビットの 32 通りそれぞれの長さを 2 ビットずつ定数 0x3a55000000000000 に詰め、シフトとマスクで引く。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/core.h
lines: [1298, 1304]
function: detail::code_point_length
difficulty: 2
format: 2
tags: [Unicode, ビット演算, ハック]
---

## ひとことで

UTF-8 では 1 文字が 1〜4 バイトで、何バイトかは **先頭のバイト** を見ればわかります。`code_point_length(p)` はその長さを返します。`'a'` なら 1、`'あ'`（先頭 `0xE3`）なら 3 です。

書式指定 `{:*^10}` の埋め文字 `*` のように、1 文字を切り出すときに使われます。表は配列ではなく **64 ビットの定数 1 個** です。

## コード

::: code-group

```cpp:line-numbers=1298 [日本語訳]
// コードポイントのコード単位の数を返す。エラー時は 1 を返す。
template <typename Char>
FMT_CONSTEXPR auto code_point_length(const Char* begin) -> int {
  if FMT_CONSTEXPR20 (sizeof(Char) != 1) return 1;
  auto c = static_cast<unsigned char>(*begin);
  return static_cast<int>((0x3a55000000000000ull >> (2 * (c >> 3))) & 3) + 1;
}
```

```cpp:line-numbers=1298 [原文]
// Returns the number of code units in a code point or 1 on error.
template <typename Char>
FMT_CONSTEXPR auto code_point_length(const Char* begin) -> int {
  if FMT_CONSTEXPR20 (sizeof(Char) != 1) return 1;
  auto c = static_cast<unsigned char>(*begin);
  return static_cast<int>((0x3a55000000000000ull >> (2 * (c >> 3))) & 3) + 1;
}
```

:::

## 前提知識

- **UTF-8 の先頭バイト**: `0xxxxxxx` は 1 バイト文字、`110xxxxx` は 2 バイト、`1110xxxx` は 3 バイト、`11110xxx` は 4 バイト文字の先頭です。`10xxxxxx` は 2 バイト目以降（継続バイト）です。
- **`static_cast<unsigned char>(*begin)`**: `char` は環境によって符号付きなので、0〜255 の値として扱うために符号なしに変換しています。
- **`if FMT_CONSTEXPR20 (…)`**: マクロで、使える環境では `if constexpr` に展開されます。条件がコンパイル時に決まり、偽の側のコードは作られません。
- **`sizeof(Char) != 1`**: 文字型が 1 バイトでない（`wchar_t` など）なら UTF-8 ではないので、常に 1 を返します。
- **`ull`**: 64 ビット以上の符号なし整数の定数を表す接尾辞です。

## 何をしているか

### 1. 先頭 5 ビットで 32 通りに分ける

`c >> 3` は先頭バイトの上位 5 ビットで、0〜31 の値になります。UTF-8 の長さは上位 5 ビットだけで決まります。

### 2. 定数の中から 2 ビットを取り出す

```cpp:line-numbers=1303
  return static_cast<int>((0x3a55000000000000ull >> (2 * (c >> 3))) & 3) + 1;
```

定数の 2 ビットずつが、32 通りそれぞれの「長さ - 1」になっています。`c >> 3` 番目の 2 ビットを、`2 * (c >> 3)` ビット右シフトして `& 3` で取り出し、1 を足します。

定数 `0x3a55000000000000` を上位 5 ビットの値ごとに読むと、次のようになります。

| 上位 5 ビット | 先頭バイト | 2 ビット | 長さ |
| --- | --- | --- | --- |
| 0〜15 | 0x00〜0x7F | 00 | 1 |
| 16〜23 | 0x80〜0xBF（継続バイト） | 00 | 1 |
| 24〜27 | 0xC0〜0xDF | 01 | 2 |
| 28〜29 | 0xE0〜0xEF | 10 | 3 |
| 30 | 0xF0〜0xF7 | 11 | 4 |
| 31 | 0xF8〜0xFF（不正） | 00 | 1 |

下位 48 ビットはすべて 0、その上の `0x55`（`01010101`）が 24〜27、`0xa`（`1010`）が 28〜29、`0x3`（`0011`）が 30〜31 に対応します。

`'あ'` の先頭 `0xE3` なら上位 5 ビットは 28。56 ビットシフトすると下位 2 ビットは `10` = 2 で、長さは **3** です。

## ここがすごい

- **表がレジスタに収まる**: 32 要素 × 2 ビット = 64 ビットなので、メモリ上の配列を引かずに、命令の中の定数として扱えます。キャッシュを汚さず、シフトとマスクだけで終わります。
- **分岐がない**: `if` を並べて先頭ビットを調べる代わりに、計算 1 本で長さが出ます。
- **不正なバイトは 1**: 継続バイトや `0xF8` 以上が先頭に来た場合は 1 を返すので、呼び出し側は少なくとも 1 バイト進めます。コメントのとおり「エラー時は 1」です。
- **UTF-8 以外を素通り**: `sizeof(Char) != 1` の判定はコンパイル時に決まるので、`wchar_t` 版では定数を返すだけの関数になります。

## まとめ

- 小さな値を返す表は、ビットを詰めて 1 つの整数定数にできる。
- UTF-8 の文字の長さは、先頭バイトの上位 5 ビットで決まる。
- シフト量を「添字 × 1 要素のビット数」にすると、整数を配列のように引ける。
- 不正な入力でも前に進む値を返すと、処理が止まらない。
