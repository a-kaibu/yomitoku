---
title: "大きな文字を 2 つに割る、サロゲートペアへの変換"
description: "WTF-8 の文字列を Windows が使う UTF-16 に変換する関数。U+FFFF を超える文字は引き算とシフトでサロゲートペアの 2 単位に割り、長さの事前計算と assert で食い違いを見張る。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright libuv contributors. All rights reserved."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/idna.c
lines: [389, 411]
function: "uv_wtf8_to_utf16"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, ビット演算, 移植性]
---

## ひとことで

`uv_wtf8_to_utf16` は、WTF-8（UTF-8 をゆるめた形式）の文字列を、Windows の API が受け取る **UTF-16** に変換する関数です。
UTF-16 は 1 単位が 16 ビットなので、U+FFFF を超える文字（絵文字など）は 1 単位に収まりません。そうした文字は **サロゲートペア** と呼ばれる 2 単位の組に割って書き込みます。
出力先の大きさは、先に別の関数 `uv_wtf8_length_as_utf16` で計算しておく約束になっています。

## コード

::: code-group

```c:line-numbers=389 [日本語訳]
void uv_wtf8_to_utf16(const char* source_ptr,
                      uint16_t* w_target,
                      size_t w_target_len) {
  int32_t code_point;

  do {
    code_point = uv__wtf8_decode1(&source_ptr);
    /* 先に uv_wtf8_length_as_utf16 を呼んで確認済みのはず。 */
    assert(code_point >= 0);
    if (code_point > 0xFFFF) {
      assert(code_point <= 0x10FFFF);
      *w_target++ = (((code_point - 0x10000) >> 10) + 0xD800);
      *w_target++ = ((code_point - 0x10000) & 0x3FF) + 0xDC00;
      w_target_len -= 2;
    } else {
      *w_target++ = code_point;
      w_target_len -= 1;
    }
  } while (*source_ptr++);

  (void)w_target_len;
  assert(w_target_len == 0);
}
```

```c:line-numbers=389 [原文]
void uv_wtf8_to_utf16(const char* source_ptr,
                      uint16_t* w_target,
                      size_t w_target_len) {
  int32_t code_point;

  do {
    code_point = uv__wtf8_decode1(&source_ptr);
    /* uv_wtf8_length_as_utf16 should have been called and checked first. */
    assert(code_point >= 0);
    if (code_point > 0xFFFF) {
      assert(code_point <= 0x10FFFF);
      *w_target++ = (((code_point - 0x10000) >> 10) + 0xD800);
      *w_target++ = ((code_point - 0x10000) & 0x3FF) + 0xDC00;
      w_target_len -= 2;
    } else {
      *w_target++ = code_point;
      w_target_len -= 1;
    }
  } while (*source_ptr++);

  (void)w_target_len;
  assert(w_target_len == 0);
}
```

:::

## 前提知識

- **UTF-16**: 文字番号（コードポイント）を 16 ビット単位で表す方式です。U+0000〜U+FFFF の文字は 1 単位、それより大きい文字は 2 単位（サロゲートペア）で表します。Windows の内部の文字列はこの形式です。
- **サロゲートペア**: U+10000 以上の文字を、上位サロゲート（0xD800〜0xDBFF）と下位サロゲート（0xDC00〜0xDFFF）の 2 つの 16 ビット値で表す仕組みです。
- **`uint16_t* w_target`**: 16 ビット整数の並びを指すポインタです。`*w_target++ = x` は「今の位置に x を書き、1 単位進む」です。
- **`do { ... } while (条件);`**: 本体を先に 1 回実行し、そのあと条件を調べる繰り返しです。最低 1 回は必ず実行されます。
- **`assert(条件)`**: 条件が偽ならプログラムを止める、開発時のチェックです。`NDEBUG` を定義してコンパイルすると消えます。
- **`(void)w_target_len;`**: 「この変数を使っている」とコンパイラに伝え、「使われていない変数」という警告を消すための書き方です。

## 何をしているか

### 1. 1 文字ずつ読む

```c:line-numbers=394
  do {
    code_point = uv__wtf8_decode1(&source_ptr);
    /* uv_wtf8_length_as_utf16 should have been called and checked first. */
    assert(code_point >= 0);
```

`uv__wtf8_decode1` で 1 文字読みます。長さ計算の関数で入力が正しいことは確かめ済みなので、ここでは `assert` で念押しするだけです。

### 2. 大きな文字をサロゲートペアに割る

```c:line-numbers=398
    if (code_point > 0xFFFF) {
      assert(code_point <= 0x10FFFF);
      *w_target++ = (((code_point - 0x10000) >> 10) + 0xD800);
      *w_target++ = ((code_point - 0x10000) & 0x3FF) + 0xDC00;
      w_target_len -= 2;
```

U+FFFF を超える文字は、まず 0x10000 を引いて 20 ビットの値にします。その **上位 10 ビット** に 0xD800 を足したものが上位サロゲート、**下位 10 ビット** に 0xDC00 を足したものが下位サロゲートです。

😀（U+1F600）で追ってみます。

- `0x1F600 - 0x10000 = 0xF600`
- 上位 10 ビット: `0xF600 >> 10 = 0x3D`、`0x3D + 0xD800 = 0xD83D`
- 下位 10 ビット: `0xF600 & 0x3FF = 0x200`、`0x200 + 0xDC00 = 0xDE00`

結果は `D83D DE00` の 2 単位で、`w_target_len` を 2 減らします。

### 3. 普通の文字はそのまま

```c:line-numbers=403
    } else {
      *w_target++ = code_point;
      w_target_len -= 1;
    }
```

U+FFFF 以下なら、番号をそのまま 1 単位として書き、`w_target_len` を 1 減らします。

### 4. 終端まで繰り返す

```c:line-numbers=407
  } while (*source_ptr++);
```

`while (*source_ptr++)` は、読み終えた文字の最後のバイトを確かめてから 1 つ進めます。最後のバイトが `'\0'`（文字列の終わり）なら止まります。終端の `'\0'` 自体も 1 単位の 0 として書き込まれるので、出力も 0 で終わる文字列になります。

### 5. 食い違いがないことを確かめる

```c:line-numbers=409
  (void)w_target_len;
  assert(w_target_len == 0);
```

最後に `w_target_len` がちょうど 0 になったかを `assert` で確かめます。先に計算した長さと実際に書いた単位数が一致した、という確認です。

## ここがすごい

- **計算だけでペアを作る**: サロゲートペアの作り方は表を引く必要がなく、引き算・シフト・マスク・足し算だけで済みます。上位と下位で範囲が 0xD800 台と 0xDC00 台に分かれているので、受け取った側も 1 単位見ただけで「ペアの前半か後半か」がわかります。
- **「長さを数える」と「書き込む」を分ける**: 呼び出し側はまず `uv_wtf8_length_as_utf16` で必要な単位数を数え、ちょうどの大きさの領域を確保してからこの関数を呼びます。こうすると変換の途中で領域が足りなくなることがなく、この関数はエラー処理なしで書けます。
- **残量を減らしながら最後に照合**: `w_target_len` は書き込みには使っていませんが、毎回減らして最後に 0 になるかを確かめています。2 つの関数の計算が食い違うバグがあれば、開発中にすぐ気づけます。本番ビルドでは `assert` ごと消えるので、速さへの影響もありません。

## まとめ

- UTF-16 では U+10000 以上の文字を、上位・下位サロゲートの 2 単位で表す。
- `(cp - 0x10000) >> 10` と `& 0x3FF` で 20 ビットを 10 ビットずつに割る。
- 先に必要な長さを数えてから変換すると、変換関数はエラー処理なしで書ける。
- 「使わないが減らしていく」変数と `assert` で、2 つの関数の食い違いを見張れる。
