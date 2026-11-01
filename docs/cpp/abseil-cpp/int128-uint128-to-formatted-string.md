---
title: 128 ビット整数を「64 ビットに収まる 3 切れ」に分けて表示する
description: uint128 を 10 進・16 進・8 進の文字列にする関数。64 ビットに収まる最大の基数のべき乗で 3 つに切り分け、既存の 64 ビット出力とゼロ埋めで組み立てる。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/numeric/int128.cc
lines: [161, 203]
function: Uint128ToFormattedString
difficulty: 2
tags: [数値計算, 文字列処理, 標準ライブラリ]
---

## ひとことで

`Uint128ToFormattedString` は、128 ビットの符号なし整数を文字列にする関数です。10 進数・16 進数・8 進数に対応します。
C++ の標準ストリームは 64 ビット整数までしか表示できません。そこでこの関数は、数を **64 ビットに収まる 3 つの切れ端** に分け、それぞれを標準の機能で表示してつなげます。

## コード

::: code-group

```cpp:line-numbers=161 [日本語訳]
std::string Uint128ToFormattedString(uint128 v, std::ios_base::fmtflags flags) {
  // 2^64 未満で最大の、基数のべき乗を割る数に選ぶ。
  uint128 div;
  int div_base_log;
  switch (flags & std::ios::basefield) {
    case std::ios::hex:
      div = 0x1000000000000000;  // 16^15
      div_base_log = 15;
      break;
    case std::ios::oct:
      div = 01000000000000000000000;  // 8^21
      div_base_log = 21;
      break;
    default:  // std::ios::dec
      div = 10000000000000000000u;  // 10^19
      div_base_log = 19;
      break;
  }

  // ここからは、元の値を 3 つの塊に分けて uint128 の表現を組み立てる。
  // どの塊も "div" より小さいので、
  // uint64_t で表せる。
  std::ostringstream os;
  std::ios_base::fmtflags copy_mask =
      std::ios::basefield | std::ios::showbase | std::ios::uppercase;
  os.setf(flags & copy_mask, copy_mask);
  uint128 high = v;
  uint128 low;
  DivModImpl(high, div, &high, &low);
  uint128 mid;
  DivModImpl(high, div, &high, &mid);
  if (Uint128Low64(high) != 0) {
    os << Uint128Low64(high);
    os << std::noshowbase << std::setfill('0') << std::setw(div_base_log);
    os << Uint128Low64(mid);
    os << std::setw(div_base_log);
  } else if (Uint128Low64(mid) != 0) {
    os << Uint128Low64(mid);
    os << std::noshowbase << std::setfill('0') << std::setw(div_base_log);
  }
  os << Uint128Low64(low);
  return os.str();
}
```

```cpp:line-numbers=161 [原文]
std::string Uint128ToFormattedString(uint128 v, std::ios_base::fmtflags flags) {
  // Select a divisor which is the largest power of the base < 2^64.
  uint128 div;
  int div_base_log;
  switch (flags & std::ios::basefield) {
    case std::ios::hex:
      div = 0x1000000000000000;  // 16^15
      div_base_log = 15;
      break;
    case std::ios::oct:
      div = 01000000000000000000000;  // 8^21
      div_base_log = 21;
      break;
    default:  // std::ios::dec
      div = 10000000000000000000u;  // 10^19
      div_base_log = 19;
      break;
  }

  // Now piece together the uint128 representation from three chunks of the
  // original value, each less than "div" and therefore representable as a
  // uint64_t.
  std::ostringstream os;
  std::ios_base::fmtflags copy_mask =
      std::ios::basefield | std::ios::showbase | std::ios::uppercase;
  os.setf(flags & copy_mask, copy_mask);
  uint128 high = v;
  uint128 low;
  DivModImpl(high, div, &high, &low);
  uint128 mid;
  DivModImpl(high, div, &high, &mid);
  if (Uint128Low64(high) != 0) {
    os << Uint128Low64(high);
    os << std::noshowbase << std::setfill('0') << std::setw(div_base_log);
    os << Uint128Low64(mid);
    os << std::setw(div_base_log);
  } else if (Uint128Low64(mid) != 0) {
    os << Uint128Low64(mid);
    os << std::noshowbase << std::setfill('0') << std::setw(div_base_log);
  }
  os << Uint128Low64(low);
  return os.str();
}
```

:::

## 前提知識

- **`std::ostringstream`**: 文字列に向かって `<<` で書き込めるストリームです。最後に `os.str()` で書き込んだ内容を `std::string` として取り出せます。
- **`std::ios_base::fmtflags`**: ストリームの表示設定（10 進か 16 進か、`0x` を付けるか、大文字にするか）をビットの組み合わせで表す型です。`flags & std::ios::basefield` で「基数の部分」だけを取り出せます。
- **マニピュレータ**: `std::setw(n)`（幅を n にする）、`std::setfill('0')`（余白を `0` で埋める）、`std::noshowbase`（`0x` を付けない）のように、`<<` で流してストリームの設定を変える部品です。`setw` は **次の 1 回の出力にしか効かない** 点に注意します。
- **`01000000000000000000000`**: C++ では先頭が `0` の整数リテラルは 8 進数です。`0x` で始まれば 16 進数です。
- **`DivModImpl(a, b, &q, &r)`**: 同じファイルにある 128 ビットの割り算関数で、商と余りを同時に返します。`&` を付けると変数の場所（アドレス）を渡せます。

## 何をしているか

### 1. 切り分けるための割る数を選ぶ

```cpp:line-numbers=162
  // 2^64 未満で最大の、基数のべき乗を割る数に選ぶ。
  uint128 div;
  int div_base_log;
  switch (flags & std::ios::basefield) {
    case std::ios::hex:
      div = 0x1000000000000000;  // 16^15
      div_base_log = 15;
      break;
    case std::ios::oct:
      div = 01000000000000000000000;  // 8^21
      div_base_log = 21;
      break;
    default:  // std::ios::dec
      div = 10000000000000000000u;  // 10^19
      div_base_log = 19;
      break;
  }
```

基数ごとに、**64 ビットに収まる最大のべき乗** を選びます。

- 10 進: `10^19`（19 桁）
- 16 進: `16^15`（15 桁）
- 8 進: `8^21`（21 桁）

`div_base_log` は、そのべき乗が何桁ぶんかを表します。後でゼロ埋めの幅に使います。

### 2. 3 つに切り分ける

```cpp:line-numbers=187
  uint128 high = v;
  uint128 low;
  DivModImpl(high, div, &high, &low);
  uint128 mid;
  DivModImpl(high, div, &high, &mid);
```

`DivModImpl` を 2 回呼んで、`v` を `high`・`mid`・`low` に分けます。どれも `div` 未満なので 64 ビットに収まります。
`10^19` の 3 乗は約 `10^57` で、128 ビットの最大値（約 `3.4 × 10^38`）より十分大きいので、3 つあれば必ず足ります。

### 3. 上から順に書く

```cpp:line-numbers=192
  if (Uint128Low64(high) != 0) {
    os << Uint128Low64(high);
    os << std::noshowbase << std::setfill('0') << std::setw(div_base_log);
    os << Uint128Low64(mid);
    os << std::setw(div_base_log);
  } else if (Uint128Low64(mid) != 0) {
    os << Uint128Low64(mid);
    os << std::noshowbase << std::setfill('0') << std::setw(div_base_log);
  }
  os << Uint128Low64(low);
```

`v = 5 × 10^19 + 42` で追ってみます。

- `low = 42`、`mid = 5`、`high = 0` に分かれます。
- `high` は 0 なので `else if (Uint128Low64(mid) != 0)` の分岐に入り、まず `5` を書きます。
- 次に `noshowbase`、`setfill('0')`、`setw(19)` を設定します。
- 最後の `os << Uint128Low64(low);` で `low` を書くと、42 が 19 桁にゼロ埋めされて `0000000000000000042` になります。

結果は `50000000000000000042` です。真ん中や下の切れ端は、**桁数が足りなければ必ず 0 で埋める** 必要があります。そうしないと `542` のように桁が詰まってしまいます。

### 4. 表示設定を引き継ぐ

```cpp:line-numbers=184
  std::ios_base::fmtflags copy_mask =
      std::ios::basefield | std::ios::showbase | std::ios::uppercase;
  os.setf(flags & copy_mask, copy_mask);
```

呼び出し元から渡された `flags` のうち、基数・`0x` の有無・大文字かどうかの 3 つだけを `os` にコピーしています。

## ここがすごい

- **車輪を再発明しない**: 16 進数の大文字化や `0x` の付与を自前で書くと、ストリームの設定との整合性を取るのが大変です。64 ビットに収まる単位に切れば、あとは標準ストリームに任せられます。
- **`0x` は先頭に 1 回だけ**: 最初の切れ端を書いたあとに `std::noshowbase` を流しています。これがないと、`0x1` `0x0000…` のように切れ端ごとに `0x` が付いてしまいます。
- **`setw` の性質に合わせた書き方**: `setw` は 1 回の出力でリセットされるので、`high` がある場合は `low` の前にもう一度 `setw` を設定しています。細かいですが、これを忘れると下の切れ端のゼロ埋めが消えます。
- **割り算の回数が少ない**: 1 桁ずつ 10 で割って文字を作る方法だと、128 ビットの割り算を最大 39 回行うことになります。この方法なら 2 回で済み、残りは速い 64 ビットの出力に任せられます。

## まとめ

- 大きな数の表示は「扱える大きさの塊に切って、ゼロ埋めでつなぐ」と考える。
- 切る単位は「基数のべき乗のうち、扱える型に収まる最大のもの」にする。
- `setw` は次の 1 回の出力にしか効かない。
- 既存の部品（標準ストリーム）を最大限に使うと、書式の細かい仕様を自分で実装せずに済む。
