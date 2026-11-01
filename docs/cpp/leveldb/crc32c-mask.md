---
title: CRC をそのまま保存しないための「回転して足す」マスク
description: LevelDB がファイルに CRC を書く前に通す変換。CRC を含むデータの CRC を計算すると不都合が起きるため、ビット回転と定数の加算で値を崩し、読み出し時に元へ戻す。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/crc32c.h
lines: [22, 38]
function: crc32c::Mask / crc32c::Unmask
difficulty: 2
format: 2
tags: [ビット演算, 防御的プログラミング, ファイル]
---

## ひとことで

CRC（巡回冗長検査）は、データが壊れていないかを確かめるための短い値です。LevelDB はログやテーブルのファイルに、データと一緒に CRC を書き込みます。
`Mask` は、その CRC を **そのままではなく、ビットを回転させて定数を足した形** にしてから保存するための関数です。`Unmask` はその逆で、読み出した値から元の CRC を取り戻します。

## コード

::: code-group

```cpp:line-numbers=22 [日本語訳]
static const uint32_t kMaskDelta = 0xa282ead8ul;

// crc をマスクした表現を返す。
//
// 理由: CRC が埋め込まれた文字列の CRC を計算するのは
// 問題がある。そのため、どこか（ファイルなど）に保存する CRC は
// 保存前にマスクすることを勧める。
inline uint32_t Mask(uint32_t crc) {
  // 右に 15 ビット回転して、定数を足す。
  return ((crc >> 15) | (crc << 17)) + kMaskDelta;
}

// マスクした表現が masked_crc である crc を返す。
inline uint32_t Unmask(uint32_t masked_crc) {
  uint32_t rot = masked_crc - kMaskDelta;
  return ((rot >> 17) | (rot << 15));
}
```

```cpp:line-numbers=22 [原文]
static const uint32_t kMaskDelta = 0xa282ead8ul;

// Return a masked representation of crc.
//
// Motivation: it is problematic to compute the CRC of a string that
// contains embedded CRCs.  Therefore we recommend that CRCs stored
// somewhere (e.g., in files) should be masked before being stored.
inline uint32_t Mask(uint32_t crc) {
  // Rotate right by 15 bits and add a constant.
  return ((crc >> 15) | (crc << 17)) + kMaskDelta;
}

// Return the crc whose masked representation is masked_crc.
inline uint32_t Unmask(uint32_t masked_crc) {
  uint32_t rot = masked_crc - kMaskDelta;
  return ((rot >> 17) | (rot << 15));
}
```

:::

## 前提知識

- **`inline`**: ヘッダファイルに書いた関数を、呼び出し元に展開してよいという指定です。複数のファイルから読み込まれても問題が起きません。
- **`static const uint32_t`**: このファイル（を読み込んだ翻訳単位）だけで使う 32 ビットの定数です。末尾の `ul` は「符号なし long」のリテラルであることを表します。
- **ビット回転**: `(x >> 15) | (x << 17)` は、32 ビットの値を右に 15 ビット回します。右からはみ出した 15 ビットが左端に戻ってきます。情報は 1 ビットも失われません。
- **符号なし整数の足し算・引き算**: `uint32_t` で 2^32 を超えたり 0 を下回ったりすると、2^32 で割った余りになります（あふれても値が「一周」するだけ）。だから、足した数を引けば必ず元に戻ります。

## 何をしているか

### 1. Mask: 回して足す

```cpp:line-numbers=29
inline uint32_t Mask(uint32_t crc) {
  // 右に 15 ビット回転して、定数を足す。
  return ((crc >> 15) | (crc << 17)) + kMaskDelta;
}
```
たとえば CRC が `0x00000001` なら、右に 15 ビット回すと、いちばん下の 1 ビットが 17 ビット目（上から数えて 15 番目）に来て、`0x00020000` になります。
これに `kMaskDelta = 0xa282ead8` を足すと `0xa284ead8` です。これがファイルに書かれます。

### 2. Unmask: 引いて戻す

```cpp:line-numbers=35
inline uint32_t Unmask(uint32_t masked_crc) {
  uint32_t rot = masked_crc - kMaskDelta;
  return ((rot >> 17) | (rot << 15));
}
```
逆の順で操作します。まず `0xa284ead8 - 0xa282ead8 = 0x00020000` で定数を外します。
次に左に 15 ビット回す（`(rot >> 17) | (rot << 15)` は「右に 17 = 左に 15」の回転）と、`0x00000001` に戻ります。
足し算と回転はどちらも逆操作があるので、`Unmask(Mask(x)) == x` がどんな値でも成り立ちます。

## ここがすごい

- **「CRC の中の CRC」問題を避ける**: 関数の上のコメントによると、CRC が埋め込まれたデータの CRC を計算するのは問題を起こしやすい、とあります。CRC には「データの後ろにそのデータの CRC を付けたもの」の CRC が特定の値になる、といった数学的な性質があります。そのため、たとえば LevelDB のファイル全体をさらに別の CRC で守るような場面で、偶然に頼った検査になってしまうおそれがあります。保存前に値を崩しておけば、こうした性質が表に出ません。
- **ほぼタダで元に戻せる**: 回転と足し算は、どちらも 1〜2 命令の軽い演算で、しかも逆演算が簡単です。暗号のように隠す必要はなく、「CRC そのものの形でなくなればよい」という目的にちょうどよい重さです。
- **すべての値が 1 対 1**: 回転も加算も、32 ビットの値の並べ替え（全単射）です。異なる CRC が同じマスク値になることはないので、検査の力は落ちません。
- **関数にして意図を残す**: マスクとアンマスクをペアで用意し、理由をコメントに書いています。読み書きの両側で同じ関数を使うので、片方だけ変えてしまう事故も防げます。

## まとめ

- 保存する検査値は、元の形のまま置かないほうがよい場合がある。
- ビット回転と定数の加算は、軽くて確実に元に戻せる変換。
- 逆変換は「後でした操作から先に戻す」順番で書く。
- 書く側と読む側の変換は、対になった関数として用意する。
