---
title: 壊れた入力にも負けない ULEB128 デコーダの境界チェック
description: 可変長整数 ULEB128 を読む decodeULEB128。バッファの終端越えと 64 ビットあふれを検出し、未定義動作になるシフトも避ける。読み込み処理の防御の見本。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/LEB128.h
lines: [136, 185]
function: llvm::decodeULEB128
difficulty: 2
tags: [パース, 防御的プログラミング, エラー処理]
format: 2
---

## ひとことで

`decodeULEB128` は、可変長整数 **ULEB128** のバイト列を読んで、`uint64_t` の値に戻す関数です。
`AC 02` を読むと `300` が得られ、`n` には読んだバイト数 `2` が入ります。

ファイルから読み込むデータは壊れていることがあります。この関数は「**途中で入力が切れている**」「**64 ビットに収まらない**」という 2 種類の異常を、安全に検出して報告します。

## コード

::: code-group

```cpp:line-numbers=136 [日本語訳]
/// ULEB128 の値をデコードし、型付きのエラーを報告するユーティリティ関数。
///
/// \p p はエンコードされた値の最初のバイト。
/// \p n が null でなければ、読んだバイト数を受け取る。
/// \p end が null でなければ、その住所以降は読まない。
/// \p error が null でなければ、エラーのとき静的なエラーメッセージを指す。
/// 成功時には変更されない。
/// \p errorCode が null でなければ、デコードの結果を示す。
/// 入口で \c None に設定され、デコードに失敗したときだけ変わる。
inline uint64_t decodeULEB128(const uint8_t *p, unsigned *n, const uint8_t *end,
                              const char **error,
                              ULEB128DecodeError *errorCode) {
  if (errorCode)
    *errorCode = ULEB128DecodeError::None;

  const uint8_t *orig_p = p;
  uint64_t Value = 0;
  unsigned Shift = 0;
  do {
    if (LLVM_UNLIKELY(p == end)) {
      if (error)
        *error = "malformed uleb128, extends past end";
      if (errorCode)
        *errorCode = ULEB128DecodeError::UnexpectedEnd;
      Value = 0;
      break;
    }
    uint64_t Slice = *p & 0x7f;
    if (LLVM_UNLIKELY(Shift >= 63) &&
        ((Shift == 63 && (Slice << Shift >> Shift) != Slice) ||
         (Shift > 63 && Slice != 0))) {
      if (error)
        *error = "uleb128 too big for uint64";
      if (errorCode)
        *errorCode = ULEB128DecodeError::TooBig;
      Value = 0;
      break;
    }
    // Shift が 64 に達したら、残りのバイトは上で「ただのゼロ拡張」と
    // 検証済みなので、値には何も寄与しない。Shift >= 64 で
    // "Slice << Shift" を行うと未定義動作になるので、
    // 飛ばす。
    if (LLVM_LIKELY(Shift < 64))
      Value += Slice << Shift;
    Shift += 7;
  } while (*p++ >= 128);
  if (n)
    *n = (unsigned)(p - orig_p);
  return Value;
}
```

```cpp:line-numbers=136 [原文]
/// Utility function to decode a ULEB128 value and report a typed error.
///
/// \p p is the first byte of the encoding.
/// If \p n is non-null, it receives the number of bytes consumed.
/// If \p end is non-null, decoding will not read at or beyond that address.
/// If \p error is non-null, it will point to a static error message if an error
/// occurred. It will not be modified on success.
/// If \p errorCode is non-null, it will identify the decoding outcome. It is
/// set to \c None on entry and only changed when decoding fails.
inline uint64_t decodeULEB128(const uint8_t *p, unsigned *n, const uint8_t *end,
                              const char **error,
                              ULEB128DecodeError *errorCode) {
  if (errorCode)
    *errorCode = ULEB128DecodeError::None;

  const uint8_t *orig_p = p;
  uint64_t Value = 0;
  unsigned Shift = 0;
  do {
    if (LLVM_UNLIKELY(p == end)) {
      if (error)
        *error = "malformed uleb128, extends past end";
      if (errorCode)
        *errorCode = ULEB128DecodeError::UnexpectedEnd;
      Value = 0;
      break;
    }
    uint64_t Slice = *p & 0x7f;
    if (LLVM_UNLIKELY(Shift >= 63) &&
        ((Shift == 63 && (Slice << Shift >> Shift) != Slice) ||
         (Shift > 63 && Slice != 0))) {
      if (error)
        *error = "uleb128 too big for uint64";
      if (errorCode)
        *errorCode = ULEB128DecodeError::TooBig;
      Value = 0;
      break;
    }
    // Once Shift reaches 64 the remaining bytes have already been validated
    // above to be pure zero-extension, so they contribute nothing. Performing
    // "Slice << Shift" with Shift >= 64 would be undefined behavior, so skip
    // it.
    if (LLVM_LIKELY(Shift < 64))
      Value += Slice << Shift;
    Shift += 7;
  } while (*p++ >= 128);
  if (n)
    *n = (unsigned)(p - orig_p);
  return Value;
}
```

:::

## 前提知識

- **ポインタ `const uint8_t *p`**: メモリ上のバイトを指す住所です。`*p` でその場所のバイトを読み、`p++` で次のバイトへ進みます。`const` は「読むだけで書き換えない」という意味です。
- **出力用ポインタ引数**: `unsigned *n` や `const char **error` は、結果を書き込む先です。`nullptr`（どこも指さない）なら「要らない」という意味なので、使う前に `if (n)` で確かめます。
- **`const char **error`**: 「文字列へのポインタ」を書き込む先です。`*error = "..."` で、固定のエラーメッセージを指させます。
- **`enum class`**: 名前付きの定数の集まりです。`ULEB128DecodeError::TooBig` のように書きます。
- **`LLVM_LIKELY` / `LLVM_UNLIKELY`**: 「この条件はたいてい真（偽）」とコンパイラに伝えるマクロです。よく通る道を速くする配置にしてもらえます。
- **シフトの未定義動作**: 64 ビットの値を 64 以上シフトすると未定義動作です。

## 何をしているか

### 1. 7 ビットずつ足し込む

```cpp:line-numbers=163
    uint64_t Slice = *p & 0x7f;
```

```cpp:line-numbers=178
    if (LLVM_LIKELY(Shift < 64))
      Value += Slice << Shift;
    Shift += 7;
  } while (*p++ >= 128);
```

`AC 02` で追います。

```
1 バイト目: Slice = 0xAC & 0x7f = 44,  Value = 44,         Shift = 7
            0xAC >= 128 なので続く
2 バイト目: Slice = 0x02,             Value = 44 + 2<<7 = 300, Shift = 14
            0x02 < 128 なので終わり
```

ループ条件の `*p++ >= 128` は「今のバイトの最上位ビット（続きの印）が立っているか」を調べつつ、ポインタを次へ進めています。

### 2. 入力が途中で切れていないか

```cpp:line-numbers=155
    if (LLVM_UNLIKELY(p == end)) {
      if (error)
        *error = "malformed uleb128, extends past end";
      if (errorCode)
        *errorCode = ULEB128DecodeError::UnexpectedEnd;
      Value = 0;
      break;
    }
```

`end` は「ここから先は読んではいけない」という住所です。続きの印があるのにバッファが尽きたら、エラーメッセージとエラーコードを設定し、値を 0 にしてループを抜けます。`end` が `nullptr` なら `p == end` は決して真にならず、チェックは実質無効になります。

### 3. 64 ビットに収まるか

```cpp:line-numbers=164
    if (LLVM_UNLIKELY(Shift >= 63) &&
        ((Shift == 63 && (Slice << Shift >> Shift) != Slice) ||
         (Shift > 63 && Slice != 0))) {
      if (error)
        *error = "uleb128 too big for uint64";
      if (errorCode)
        *errorCode = ULEB128DecodeError::TooBig;
      Value = 0;
      break;
    }
```

64 ビットのうち、7 ビットずつ 9 バイトで 63 ビット分が埋まります。10 バイト目（`Shift == 63`）で入れられるのは**最下位の 1 ビットだけ**です。

- `Shift == 63` のとき: `Slice << 63 >> 63` は、`Slice` の最下位ビット以外を消した値です。元の `Slice` と違えば、はみ出すビットがあるのでエラーです。
- `Shift > 63` のとき: 11 バイト目以降の値は 0 でなければエラーです。

### 4. 大きすぎるシフトをしない

```cpp:line-numbers=174
    // Shift が 64 に達したら、残りのバイトは上で「ただのゼロ拡張」と
    // 検証済みなので、値には何も寄与しない。Shift >= 64 で
    // "Slice << Shift" を行うと未定義動作になるので、
    // 飛ばす。
    if (LLVM_LIKELY(Shift < 64))
      Value += Slice << Shift;
```

`Shift` が 64 以上になっても、値が 0 のバイト（パディング）は正当です。しかしそのまま `Slice << Shift` を計算すると未定義動作です。そこで `Shift < 64` のときだけ足し込みます。0 を足しても値は変わらないので、結果は同じです。

### 5. 読んだバイト数を返す

```cpp:line-numbers=182
  if (n)
    *n = (unsigned)(p - orig_p);
```

`p` は進んだ後なので、`p - orig_p` が読んだバイト数です。

## ここがすごい

LEB128 のデコードは、素直に書けば 5 行ほどです。

```cpp
do { Value += (*p & 0x7f) << Shift; Shift += 7; } while (*p++ >= 128);
```

しかしこれには、バッファの外を読み続ける、64 ビットを超えた値を黙って切り捨てる、シフトの未定義動作を起こす、という 3 つの危険があります。壊れたファイルや悪意のある入力を読むツール（逆アセンブラやリンカ）では、どれも深刻です。

この実装は、3 つすべてに手当てをしています。しかも、

- 異常チェックは `LLVM_UNLIKELY` で「まず起きない側」と伝えて、正常系の速度を落とさない
- 「パディングとしては正しい 0 のバイト」は許し、本当に値がはみ出す場合だけをエラーにする
- エラーを文字列とコードの両方で、**要る人だけが受け取れる**ようにする（すべてポインタで任意）

と、正しさ・速さ・使いやすさの釣り合いがよく取れています。

## まとめ

- 外部からのバイト列を読む関数は、終端越えとあふれの両方を検査する。
- 64 ビットの 10 バイト目に入るのは 1 ビットだけ。`x << 63 >> 63` で検査できる。
- 型の幅以上のシフトは未定義動作なので、効果が無いとわかっている場合は計算自体を飛ばす。
- 出力を任意のポインタにすると、呼び出し側が必要な情報だけ受け取れる。
