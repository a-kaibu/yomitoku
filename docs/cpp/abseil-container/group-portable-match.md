---
title: 8 バイトを一度に調べる SwissTable の「ハッシュ照合」ビットハック
description: SIMD 命令が使えない環境向けに、64 ビット整数 1 個を 8 個の箱とみなして、8 スロット分の制御バイトを一度に照合する Abseil の関数。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2025 The Abseil Authors
file: absl/container/internal/hashtable_control_bytes.h
lines: [451, 468]
function: GroupPortableImpl::Match
difficulty: 3
tags: [ビット演算, ハッシュ, 最適化, データ構造]
---

## ひとことで

Abseil のハッシュテーブル（`absl::flat_hash_map` など。内部では SwissTable と呼ばれます）は、各スロットに 1 バイトの「制御バイト」を持っています。
`Match` は、**8 スロット分の制御バイトの中から、探しているハッシュの断片（7 ビット）と一致するものを、ループなしで一度に探す** 関数です。
SSE2 などの SIMD 命令が使えない CPU 向けの「ふつうの整数演算だけ」で書かれた版です。

## コード

::: code-group

```cpp:line-numbers=451 [日本語訳]
  BitMaskType Match(h2_t hash) const {
    // 手法については次を参照:
    // http://graphics.stanford.edu/~seander/bithacks.html##ValueInWord
    // （ワードの中に n と等しいバイトがあるかを判定する）。
    //
    // 注意: 偽陽性はあるが、
    // - 本物の一致があるときにしか起きない
    // - ctrl_t::kEmpty、ctrl_t::kDeleted、ctrl_t::kSentinel では決して起きない
    // - 後続のコードのチェックで問題なく処理される
    //
    // 例:
    //   v = 0x1716151413121110
    //   hash = 0x12
    //   retval = (v - lsbs) & ~v & msbs = 0x0000000080800000
    constexpr uint64_t lsbs = 0x0101010101010101ULL;
    auto x = ctrl ^ (lsbs * hash);
    return BitMaskType((x - lsbs) & ~x & kMsbs8Bytes);
  }
```

```cpp:line-numbers=451 [原文]
  BitMaskType Match(h2_t hash) const {
    // For the technique, see:
    // http://graphics.stanford.edu/~seander/bithacks.html##ValueInWord
    // (Determine if a word has a byte equal to n).
    //
    // Caveat: there are false positives but:
    // - they only occur if there is a real match
    // - they never occur on ctrl_t::kEmpty, ctrl_t::kDeleted, ctrl_t::kSentinel
    // - they will be handled gracefully by subsequent checks in code
    //
    // Example:
    //   v = 0x1716151413121110
    //   hash = 0x12
    //   retval = (v - lsbs) & ~v & msbs = 0x0000000080800000
    constexpr uint64_t lsbs = 0x0101010101010101ULL;
    auto x = ctrl ^ (lsbs * hash);
    return BitMaskType((x - lsbs) & ~x & kMsbs8Bytes);
  }
```

:::

## 前提知識

- **`uint64_t`**: 符号なし 64 ビット整数です。ここでは 8 バイトを 1 つの整数にまとめて扱います。
- **`0x...ULL`**: 16 進数の整数リテラルです。末尾の `ULL` は「unsigned long long（64 ビット以上の符号なし整数）」として扱うという印です。
- **`^`・`&`・`~`**: それぞれビットごとの XOR（違えば 1）、AND（両方 1 なら 1）、NOT（反転）です。
- **`constexpr`**: コンパイル時に値が決まる定数であることを示します。`lsbs` は実行時に計算されません。
- **`auto`**: 右辺から型を推論して変数を宣言します。ここでは `uint64_t` になります。
- **メンバ関数の後ろの `const`**: この関数がオブジェクトの中身（ここではメンバ変数 `ctrl`）を書き換えないことを約束する印です。
- **`h2_t`**: `uint8_t`（1 バイトの符号なし整数）の別名です。ハッシュ値の上位 7 ビットが入っています。
- **`kMsbs8Bytes`**: 同じファイルで `0x8080808080808080ULL` と定義された定数で、各バイトの最上位ビットだけが 1 です。

## 何をしているか

制御バイトには「空き」「削除済み」「番兵」という特別な値と、「使用中（下位 7 ビットにハッシュの断片 H2 を入れたもの）」があります。特別な値はどれも最上位ビットが 1、使用中は最上位ビットが 0 です。
`ctrl` には 8 スロット分の制御バイトが、リトルエンディアン（下位バイトが先頭スロット）で 64 ビットに詰め込まれています。

コメントにある例 `ctrl = 0x1716151413121110`、`hash = 0x12` で追ってみます。

### 1. 一致するバイトを 0 にする

```cpp:line-numbers=465
    constexpr uint64_t lsbs = 0x0101010101010101ULL;
    auto x = ctrl ^ (lsbs * hash);
```

`lsbs * hash` は `0x1212121212121212` です。`0x01` が 8 個並んだ数に掛けると、同じバイトを 8 回並べた値になります。
これと `ctrl` を XOR すると、**ちょうど一致したバイトだけが `0x00`** になります。

```
x = 0x0504070601000302   （下位から 0 始まりで 2 番目のバイトが 00）
```

### 2. 「0 のバイト」を見つける

```cpp:line-numbers=467
    return BitMaskType((x - lsbs) & ~x & kMsbs8Bytes);
```

`(x - lsbs) & ~x & kMsbs8Bytes` は「ワードの中に 0 のバイトがあるか」を調べる有名なビットハックです（コメントの参照先 Bit Twiddling Hacks に載っています）。

- 0 のバイトから 1 を引くと、繰り下がって `0xFF` になり、最上位ビットが立ちます。
- 元のバイトの最上位ビットが 0 だったところだけを残すために `~x` と AND を取ります。
- 最後に各バイトの最上位ビットだけを取り出します。

この例では結果が `0x0000000080800000` になります。2 番目のバイト（スロット 2）が本物の一致です。
ところが 3 番目のバイト（`0x13`）にも印が付いています。これは 2 番目のバイトで起きた繰り下がりが、となりのバイトに伝わったせいです。

### 3. 偽陽性はあとで弾く

```cpp:line-numbers=456
    // Caveat: there are false positives but:
    // - they only occur if there is a real match
    // - they never occur on ctrl_t::kEmpty, ctrl_t::kDeleted, ctrl_t::kSentinel
    // - they will be handled gracefully by subsequent checks in code
```

コメントにあるとおり、この偽の一致は **本物の一致があるときにしか起きません**。そして呼び出し側は候補ごとに本当のキーを比較するので、偽陽性は結果に影響しません。
また、特別な値（空き・削除済み・番兵）は最上位ビットが 1 です。`hash` は 7 ビットなので XOR しても最上位ビットは 1 のままです。そのため `~x` で必ず消え、誤って一致扱いになることはありません。

## ここがすごい

- **素直に書くと 8 回のループと比較** になるところを、掛け算 1 回・XOR・引き算・AND 2 回で済ませています。分岐がないので、どのスロットが一致しても同じ速さです。
- **完璧さを捨てて速さを取る設計**: 繰り下がりを完全に防ぐ版も作れますが、演算が増えます。「偽陽性はあとでキー比較が弾く」という前提があるから、安い式で済ませられます。コメントにその前提が箇条書きで残されているのもよいところです。
- **制御バイトの値の決め方とセット**: 特別な値の最上位ビットを 1 にそろえたことで、この関数のような判定が安く書けます。データ表現と処理を一緒に設計している好例です。

## まとめ

- `0x0101...01 * b` で「同じバイトを並べた値」が作れる。
- XOR で一致を 0 に変え、`(x - 0x01..) & ~x & 0x80..` で 0 のバイトを探せる。
- 後段で確認するなら、多少の偽陽性を許して速い判定を選ぶのは有効な設計。
- 1 つの整数を小さな箱の集まりとして扱う（SWAR）と、ループなしで並列に調べられる。
