---
title: 2 のべき乗の基数ならマスクとシフトだけで 16 進・8 進・2 進
description: 整数を 2 進・8 進・16 進の文字列に変える関数。基数が 2 のべき乗であることを活かし、割り算の代わりにビットマスクとシフトで 1 桁ずつ取り出す。
language: cpp
project: "{fmt}"
repo: https://github.com/fmtlib/fmt
license: MIT
copyright: "Copyright (c) 2012 - present, Victor Zverovich and {fmt} contributors"
commit: "4ed3535092a96ac9f56fab80df83416d51bcc78e"
file: include/fmt/format.h
lines: [1507, 1518]
function: detail::do_format_base2e
difficulty: 1
format: 2
tags: [ビット演算, 文字列処理, 数値計算]
---

## ひとことで

`do_format_base2e` は、整数を **2 のべき乗の基数**（2 進・8 進・16 進）の文字列にします。`{:x}` や `{:b}` で書式を指定したときに使われる関数です。

`base_bits` は「1 桁が何ビットか」で、2 進なら 1、8 進なら 3、16 進なら 4 です。`value = 255, base_bits = 4` なら `"ff"` を書きます。

## コード

```cpp:line-numbers=1507
template <typename Char, typename UInt>
FMT_CONSTEXPR auto do_format_base2e(int base_bits, Char* out, UInt value,
                                    int size, bool upper = false) -> Char* {
  out += size;
  do {
    const char* digits = upper ? "0123456789ABCDEF" : "0123456789abcdef";
    unsigned digit = static_cast<unsigned>(value & ((1u << base_bits) - 1));
    *--out = static_cast<Char>(base_bits < 4 ? static_cast<char>('0' + digit)
                                             : digits[digit]);
  } while ((value >>= base_bits) != 0);
  return out;
}
```

## 前提知識

- **ポインタの演算**: `out += size` は書き込み位置を `size` 文字ぶん後ろへ進めます。`*--out = c` は「`out` を 1 つ前に戻してから、そこに `c` を書く」という意味です。
- **`do { ... } while (条件);`**: 少なくとも 1 回は中身を実行するループです。`value = 0` でも `"0"` が 1 文字書かれます。
- **`&`（ビットごとの AND）と `>>=`（右シフトして代入）**: `value & 0xF` で下位 4 ビットを取り出し、`value >>= 4` で下位 4 ビットを捨てます。
- **`(1u << base_bits) - 1`**: 下位 `base_bits` 個のビットがすべて 1 の値（マスク）です。4 なら `0b1111` = 15 です。
- **三項演算子 `a ? b : c`**: `a` が真なら `b`、偽なら `c` です。
- **デフォルト引数 `bool upper = false`**: 呼び出し時に省略すると `false` になります。大文字の `"FF"` にしたいときだけ `true` を渡します。

## 何をしているか

### 1. 末尾から書く準備

```cpp:line-numbers=1510
  out += size;
```

書き込み位置を桁数ぶん後ろに進めます。下の桁から順に取り出すので、文字列は **右から左へ** 書いていきます。

### 2. 下位ビットを 1 桁として取り出す

```cpp:line-numbers=1512
    const char* digits = upper ? "0123456789ABCDEF" : "0123456789abcdef";
    unsigned digit = static_cast<unsigned>(value & ((1u << base_bits) - 1));
```

`value = 255`（2 進で `1111 1111`）、16 進（`base_bits = 4`）の場合:

1. `255 & 15 = 15` → `digits[15]` = `'f'` を最後の位置に書く。`value >>= 4` で 15 に。
2. `15 & 15 = 15` → `'f'` をその前に書く。`value >>= 4` で 0 に。
3. `value` が 0 なのでループ終了。結果は `"ff"`。

### 3. 2 進と 8 進は表を使わない

```cpp:line-numbers=1514
    *--out = static_cast<Char>(base_bits < 4 ? static_cast<char>('0' + digit)
                                             : digits[digit]);
```

`base_bits < 4` のとき 1 桁は 0〜7 なので、`'0' + digit` で数字の文字になります。16 進だけ `a`〜`f` が必要なので表を引きます。

## ここがすごい

- **割り算がいらない**: 一般の基数なら「基数で割った余りを取り、基数で割る」の繰り返しです。基数が 2 のべき乗なら、余りは `&` マスク、割り算は `>>` シフトで済みます。どちらも CPU では非常に軽い命令です。
- **1 つの関数で 3 つの基数**: 2 進・8 進・16 進の違いは `base_bits` だけです。基数ごとに関数を書き分けずに済みます。
- **大文字・小文字は表の切り替えだけ**: `upper` で表を 2 つから選ぶだけなので、変換処理（`toupper` など）が要りません。
- **右から書く設計**: 桁数は呼び出し側が先に数えてあるので（`count_digits<BITS>`）、書き込み先の末尾から迷わず埋められます。10 進版の `do_format_decimal` と同じ考え方です。

## まとめ

- 基数が 2 のべき乗なら、割り算と余りはシフトとマスクに置き換えられる。
- 違いを 1 つの引数（ここでは `base_bits`）に閉じ込めると、関数を共通化できる。
- 下の桁から取り出すときは、出力も右から左へ書くと素直になる。
- `do-while` を使うと「0 でも 1 桁は出す」が自然に書ける。
