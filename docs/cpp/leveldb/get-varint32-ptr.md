---
title: よくある 1 バイトの場合だけをインライン化した varint 読み出し
description: LevelDB の varint32 デコード。ほとんどの値が 1 バイトであることに注目し、その場合だけをヘッダの inline 関数で処理して、残りを別関数に任せている。
language: cpp
project: LevelDB
repo: https://github.com/google/leveldb
license: BSD-3-Clause
copyright: Copyright (c) 2011 The LevelDB Authors. All rights reserved.
commit: "bb74ef739973a70ca9f0d90788a1da89b788c0ad"
file: util/coding.h
lines: [105, 118]
function: GetVarint32Ptr
difficulty: 2
format: 2
tags: [最適化, パース, 防御的プログラミング]
---

## ひとことで

`GetVarint32Ptr` は、varint（小さい数ほど短く書ける可変長整数）で書かれたバイト列から、32 ビットの整数を 1 つ読み出す関数です。
ほとんどの値が 128 未満、つまり 1 バイトに収まることを利用して、**1 バイトの場合だけをすぐ処理し、それ以外は別の関数に回す** 作りになっています。

## コード

::: code-group

```cpp:line-numbers=105 [日本語訳]
// GetVarint32Ptr の予備経路で使う内部関数
const char* GetVarint32PtrFallback(const char* p, const char* limit,
                                   uint32_t* value);
inline const char* GetVarint32Ptr(const char* p, const char* limit,
                                  uint32_t* value) {
  if (p < limit) {
    uint32_t result = *(reinterpret_cast<const uint8_t*>(p));
    if ((result & 128) == 0) {
      *value = result;
      return p + 1;
    }
  }
  return GetVarint32PtrFallback(p, limit, value);
}
```

```cpp:line-numbers=105 [原文]
// Internal routine for use by fallback path of GetVarint32Ptr
const char* GetVarint32PtrFallback(const char* p, const char* limit,
                                   uint32_t* value);
inline const char* GetVarint32Ptr(const char* p, const char* limit,
                                  uint32_t* value) {
  if (p < limit) {
    uint32_t result = *(reinterpret_cast<const uint8_t*>(p));
    if ((result & 128) == 0) {
      *value = result;
      return p + 1;
    }
  }
  return GetVarint32PtrFallback(p, limit, value);
}
```

:::

回されるほうの関数（`util/coding.cc`）は、7 ビットずつループで組み立てます。

<!-- source: util/coding.cc -->
```cpp:line-numbers=86
const char* GetVarint32PtrFallback(const char* p, const char* limit,
                                   uint32_t* value) {
  uint32_t result = 0;
  for (uint32_t shift = 0; shift <= 28 && p < limit; shift += 7) {
    uint32_t byte = *(reinterpret_cast<const uint8_t*>(p));
    p++;
    if (byte & 128) {
      // まだ続きのバイトがある
      result |= ((byte & 127) << shift);
    } else {
      result |= (byte << shift);
      *value = result;
      return reinterpret_cast<const char*>(p);
    }
  }
  return nullptr;
}
```

## 前提知識

- **`inline`**: 関数の中身を呼び出し元に展開してよい、とコンパイラに伝える指定です。ヘッダファイルに関数の本体を書くときにも必要です。小さな関数を呼ぶコスト（ジャンプや引数の受け渡し）を消せます。
- **`const char* p`**: 読むだけのバイト列を指すポインタです。`const` が付いているので、このポインタ経由では書き換えられません。
- **`uint32_t* value`**: 結果を書き込むための出力引数です。`*value = result;` で、呼び出し元の変数に値が入ります。
- **戻り値 `const char*`**: 読み終えた位置の次を返します。失敗したら `nullptr`（どこも指さないポインタ）です。
- **`result & 128`**: 最上位ビット（varint では「続きがある」印）が立っているかを調べます。

## 何をしているか

### 1. 範囲内か確かめる

```cpp:line-numbers=110
  if (p < limit) {
```
`p < limit` で、読める 1 バイトが残っているかを確かめます。`limit` はデータの終わりの次の位置です。

### 2. 1 バイトで終わるならすぐ返す

```cpp:line-numbers=111
    uint32_t result = *(reinterpret_cast<const uint8_t*>(p));
    if ((result & 128) == 0) {
      *value = result;
      return p + 1;
    }
```
先頭バイトを符号なしで読み、最上位ビットが 0 なら、それがそのまま値です。
たとえばバイト列が `0x05 ...` なら、`*value = 5` として `p + 1` を返します。

### 3. それ以外は予備の関数へ

```cpp:line-numbers=117
  return GetVarint32PtrFallback(p, limit, value);
```
`0xAC 0x02` のように最上位ビットが立っていたら、`GetVarint32PtrFallback` を呼びます。
予備の関数は、`0xAC` の下位 7 ビット `0x2C`（44）を取り、次の `0x02` を 7 ビット左にずらして足します。`44 + 2 × 128 = 300` が得られます。
データが途中で切れていたり、5 バイト読んでも終わらなかったりすれば、`nullptr` を返して失敗を知らせます。残りが 0 バイトで `p < limit` が偽の場合も、予備の関数がすぐ `nullptr` を返します。

## ここがすごい

- **よくある場合だけを速くする**: varint はキーの長さなどに使われ、多くは 128 未満です。その場合は、比較 2 回とメモリ読み出し 1 回だけで済みます。`inline` なので関数呼び出しのコストもありません。
- **コードの大きさを抑える**: ループを含む一般的な処理まで `inline` にすると、呼び出し元すべてにそのコードが展開されて、プログラムが大きくなります。めったに通らない処理は `.cc` ファイルの普通の関数にしています。
- **壊れたデータに強い**: 「`limit` を超えて読まない」「`shift <= 28` で最大 5 バイトに制限」の 2 つの条件で、ファイルが壊れていても範囲外を読みません。失敗は `nullptr` で返すので、呼び出し側が確実に確認できます。
- **ポインタで返す API**: 読んだ後の位置を返すので、続けて次の値を読むときにそのまま渡せます。

## まとめ

- 「よくある場合」だけを小さな `inline` 関数で処理し、残りは別関数に任せると、速さとコードの大きさを両立できる。
- 外部から来るデータを読むときは、終わりの位置と最大の長さの両方で読み過ぎを防ぐ。
- 失敗を `nullptr` で表す API は、呼び出し側の確認が 1 行で済む。
