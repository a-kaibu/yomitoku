---
title: 2 桁ずつ書く整数→文字列変換で、割り算を半分にする
description: 整数を文字列に変える to_ascii_with_table。00〜99 の 2 文字を並べた表を使い、100 で割るたびに 2 桁ずつ書き込むので、1 桁ずつより割り算の回数が半分になる。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/lang/ToAscii.h
lines: [337, 358]
function: folly::detail::to_ascii_with_table
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 数値計算]
---

## ひとことで

`to_ascii_with_table` は、整数 `v` を `size` 桁の文字列として `out` に書き込みます。`v = 12345`、`size = 5` なら `"12345"` です（桁数は事前に別の関数で求めてあります）。

普通は「10 で割った余りを 1 文字ずつ書く」のですが、この関数は **100 で割った余りを、表から引いた 2 文字としてまとめて書く** ので、割り算の回数が半分になります。

## コード

::: code-group

```cpp:line-numbers=337 [日本語訳]
template <uint64_t Base, typename Alphabet>
FOLLY_ALWAYS_INLINE void to_ascii_with_table(
    char* out, size_t size, uint64_t v) {
  using table = to_ascii_table<Base, Alphabet>;
  auto pos = size;
  while (pos > 2) {
    pos -= 2;
    //  / と % を並べておくと、のぞき穴最適化で両方を一度に計算してくれる
    auto const q = v / (Base * Base);
    auto const r = v % (Base * Base);
    auto const val = table::data.data[size_t(r)];
    std::memcpy(out + pos, &val, 2);
    v = q;
  }

  auto const val = table::data.data[size_t(v)];
  if (pos == 2) {
    std::memcpy(out, &val, 2);
  } else {
    *out = val >> (kIsLittleEndian ? 8 : 0);
  }
}
```

```cpp:line-numbers=337 [原文]
template <uint64_t Base, typename Alphabet>
FOLLY_ALWAYS_INLINE void to_ascii_with_table(
    char* out, size_t size, uint64_t v) {
  using table = to_ascii_table<Base, Alphabet>;
  auto pos = size;
  while (pos > 2) {
    pos -= 2;
    //  keep /, % together so a peephole optimization computes them together
    auto const q = v / (Base * Base);
    auto const r = v % (Base * Base);
    auto const val = table::data.data[size_t(r)];
    std::memcpy(out + pos, &val, 2);
    v = q;
  }

  auto const val = table::data.data[size_t(v)];
  if (pos == 2) {
    std::memcpy(out, &val, 2);
  } else {
    *out = val >> (kIsLittleEndian ? 8 : 0);
  }
}
```

:::

使っている表 `to_ascii_table` は、同じファイルで次のように作られています（関数の外のコードです）。

```cpp:line-numbers=98
    for (size_t i = 0; i < Base * Base; ++i) {
      result.data[i] = //
          (alpha(uint8_t(i / Base)) << (kIsLittleEndian ? 0 : 8)) |
          (alpha(uint8_t(i % Base)) << (kIsLittleEndian ? 8 : 0));
    }
```

## 前提知識

- **`char* out`**: 文字を書き込む先を指すポインタです。`out + 3` は 3 文字先を指します。`*out = 'x'` で先頭に 1 文字書けます。
- **テンプレート引数 `Base` と `Alphabet`**: `Base` は基数（10 進数なら 10）、`Alphabet` は「数字 → 文字」の変換方法（小文字の `a-f` か大文字の `A-F` か）です。コンパイル時に固定されます。
- **`using table = ...;`**: 型に短い名前を付けています。`table::data.data[i]` が表の `i` 番目です。
- **表の中身**: 10 進数なら 100 個の `uint16_t` で、`i` 番目には「`i` を 2 桁で書いた 2 文字」が入っています。たとえば 45 番目は `'4'` と `'5'` の 2 バイトです。
- **`std::memcpy(dst, src, 2)`**: `src` から 2 バイトを `dst` にコピーします。`uint16_t` の 2 バイトをそのまま文字列の 2 文字として書き込めます。
- **リトルエンディアン**: 整数の下位バイトを小さいアドレスに置く方式です。表を作るとき（上の補足コード）、リトルエンディアンなら十の位の文字を下位バイトに置くことで、`memcpy` したときに十の位が先に来るよう調整しています。

## 何をしているか

`v = 12345`、`size = 5` で追います。書き込みは **後ろから** 行います。

### 1. 2 桁ずつ後ろから書く

```cpp:line-numbers=341
  auto pos = size;
  while (pos > 2) {
    pos -= 2;
    //  keep /, % together so a peephole optimization computes them together
    auto const q = v / (Base * Base);
    auto const r = v % (Base * Base);
    auto const val = table::data.data[size_t(r)];
    std::memcpy(out + pos, &val, 2);
    v = q;
  }
```

- `pos = 5` → `pos = 3`。`12345 % 100 = 45`、表から `"45"` を引いて `out[3..4]` に書く。`v = 123`
- `pos = 3` → `pos = 1`。`123 % 100 = 23`、`"23"` を `out[1..2]` に書く。`v = 1`
- `pos = 1` なのでループ終了

`q` と `r`（商と余り）を並べて計算しているのは、コメントのとおり、コンパイラが 1 回の除算命令で両方を得られるようにするためです。

### 2. 残りの 1 桁または 2 桁を書く

```cpp:line-numbers=352
  auto const val = table::data.data[size_t(v)];
  if (pos == 2) {
    std::memcpy(out, &val, 2);
  } else {
    *out = val >> (kIsLittleEndian ? 8 : 0);
  }
```

残った `v = 1` で表を引くと `"01"` です。

- `pos == 2`（残りが 2 桁）なら、2 文字をそのまま書きます。
- `pos == 1`（残りが 1 桁）なら、2 文字目の `'1'` だけが必要です。リトルエンディアンでは 2 文字目が上位バイトにあるので、`val >> 8` で取り出して `out[0]` に書きます。

結果は `"12345"` になります。偶数桁の `1234` なら、`"34"` を書いたあと `pos == 2` で `"12"` を書いて終わります。

## ここがすごい

- **割り算が半分**: 5 桁なら、1 桁ずつだと 4〜5 回の割り算が必要ですが、ここでは 2 回です。コメントによると、現代の CPU では割り算がボトルネックになるため、この差が効きます。
- **2 文字を 1 回で書く**: 表の要素を `uint16_t` にしておき、`memcpy` で 2 バイトまとめて書いています。コンパイラはこれを 1 回の 16 ビット書き込みにできます。
- **後ろから書くので反転が不要**: 桁数が先にわかっているので、最後の位置から埋めていけます。桁数がわからないと、逆順に書いてから反転する手間が必要になります。
- **トレードオフも明記**: 表を使う分コードが大きくなり、インライン化の判断に影響することも コメントで認めています。実際、`to_ascii_with_route`では、コードサイズを気にするモバイル向けビルドでは 1 桁ずつの版を使い分けています。

## まとめ

- 100 で割れば 1 回で 2 桁が得られる。表を使えば文字への変換も 1 回で済む。
- 商と余りを並べて計算すると、1 回の除算命令で両方を得られることがある。
- 桁数が先にわかっていれば、後ろから書いて反転を省ける。
- エンディアンを考えて表を作れば、2 文字を整数 1 つとして書き込める。
