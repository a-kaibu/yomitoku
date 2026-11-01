---
title: "符号なしの引き算 1 回でサロゲートを見分ける UTF-16 デコード"
description: "UTF-16 の 2 バイトまたは 4 バイトを Unicode の文字番号に戻すマクロ。「0xD800 を引いて 0x800 未満か」でサロゲートかを判定し、ペアの不正も 1 つの条件で弾く。"
language: c
project: FFmpeg
repo: https://github.com/FFmpeg/FFmpeg
license: LGPL-2.1-or-later
copyright: "copyright (c) 2006 Michael Niedermayer <michaelni@gmx.at>"
commit: "a88838af482100fa22dd22c94be592c35642de46"
file: libavutil/common.h
lines: [493, 512]
function: "GET_UTF16"
difficulty: 2
format: 2
tags: [Unicode, マクロ, 文字列処理, エラー処理]
---

## ひとことで

`GET_UTF16(val, GET_16BIT, ERROR)` は、**UTF-16 で書かれた 1 文字を読み、Unicode の文字番号（コードポイント）に戻す** マクロです。
`A`（0x0041）のように 16 ビット 1 個で済む文字はそのまま、絵文字 `😀`（U+1F600）のように 16 ビット 2 個（`D83D DE00`、サロゲートペア）で表される文字は組み立て直して `0x1F600` にします。
データの読み方（`GET_16BIT`）と、不正なデータのときの処理（`ERROR`）は呼び出し側が差し込みます。

## コード

::: code-group

```c:line-numbers=493 [日本語訳]
/**
 * UTF-16 の 1 文字（2 または 4 バイト）を 32 ビットの UCS-4 形式に変換する。
 *
 * @param val       出力先。uint32_t 型の左辺値でなければならない。
 * @param GET_16BIT UTF-16 データの 2 バイトをネイティブのバイト順にして
 *                  返す式。1 回か 2 回評価される。
 * @param ERROR     不正な入力のときに評価される式。
 *                  ふつうは goto 文。
 */
#define GET_UTF16(val, GET_16BIT, ERROR)\
    val = (uint16_t)(GET_16BIT);\
    {\
        unsigned int hi = val - 0xD800;\
        if (hi < 0x800) {\
            val = (uint16_t)(GET_16BIT) - 0xDC00;\
            if (val > 0x3FFU || hi > 0x3FFU)\
                {ERROR}\
            val += (hi<<10) + 0x10000;\
        }\
    }\
```

```c:line-numbers=493 [原文]
/**
 * Convert a UTF-16 character (2 or 4 bytes) to its 32-bit UCS-4 encoded form.
 *
 * @param val       Output value, must be an lvalue of type uint32_t.
 * @param GET_16BIT Expression returning two bytes of UTF-16 data converted
 *                  to native byte order.  Evaluated one or two times.
 * @param ERROR     Expression to be evaluated on invalid input,
 *                  typically a goto statement.
 */
#define GET_UTF16(val, GET_16BIT, ERROR)\
    val = (uint16_t)(GET_16BIT);\
    {\
        unsigned int hi = val - 0xD800;\
        if (hi < 0x800) {\
            val = (uint16_t)(GET_16BIT) - 0xDC00;\
            if (val > 0x3FFU || hi > 0x3FFU)\
                {ERROR}\
            val += (hi<<10) + 0x10000;\
        }\
    }\
```

:::

## 前提知識

- **UTF-16 とサロゲートペア**: UTF-16 は文字を 16 ビット単位で表します。U+FFFF 以下の文字は 16 ビット 1 個です。それより大きい文字は、`0xD800〜0xDBFF`（上位サロゲート）と `0xDC00〜0xDFFF`（下位サロゲート）の 2 個の組で表します。文字番号から 0x10000 を引いた 20 ビットを、上位 10 ビットと下位 10 ビットに分けて入れる仕組みです。
- **マクロ `#define`**: コンパイル前にコードを置き換える仕組みです。引数に式や文を渡せます。行末の `\` は定義が次の行に続く印です。`{ERROR}` のように引数を波かっこで囲むと、文が複数でも 1 つのまとまりとして実行されます。
- **`unsigned int` の引き算**: 符号なし整数の引き算で結果が負になると、2^32 から引いた非常に大きな数に回り込みます。この性質で「範囲内か」を 1 回の比較で判定できます。
- **`(uint16_t)(...)`**: 値を符号なし 16 ビットに変換するキャストです。
- **`<<`（左シフト）、`+=`**: `hi << 10` は hi を 2^10 倍、`val += x` は `val = val + x` です。

## 何をしているか

### 1. 16 ビットを 1 個読む

```c:line-numbers=503
    val = (uint16_t)(GET_16BIT);\
```

`val = (uint16_t)(GET_16BIT);` で最初の 16 ビットを読みます。`GET_16BIT` は、たとえば「バッファから 2 バイト読んでポインタを進める」式です。

### 2. サロゲートかどうかを 1 回で判定

```c:line-numbers=505
        unsigned int hi = val - 0xD800;\
        if (hi < 0x800) {\
```

`unsigned int hi = val - 0xD800;` を計算し、`hi < 0x800` を調べます。
`val` が 0xD800〜0xDFFF（サロゲートの範囲、幅 0x800）なら `hi` は 0〜0x7FF になります。0xD800 より小さい値は、符号なしの引き算で巨大な数に回り込むので `hi < 0x800` は偽です。
つまり `0xD800 <= val && val <= 0xDFFF` という 2 回の比較を、引き算と比較 1 回ずつで済ませています。

- `val = 0x0041`（A）: `hi` は巨大 → サロゲートではないので、`val` はそのまま 0x41
- `val = 0xD83D`: `hi = 0x3D` → サロゲート

### 3. 2 個目を読んで両方を検査

```c:line-numbers=507
            val = (uint16_t)(GET_16BIT) - 0xDC00;\
            if (val > 0x3FFU || hi > 0x3FFU)\
                {ERROR}\
```

2 個目の 16 ビットを読み、`0xDC00` を引いて `val` に入れます。そのうえで `val > 0x3FFU || hi > 0x3FFU` なら `ERROR` を実行します。

- `val > 0x3FF`: 2 個目が下位サロゲート（0xDC00〜0xDFFF）でない
- `hi > 0x3FF`: 1 個目が上位サロゲートではなく、下位サロゲート（0xDC00 以上）だった

1 個目の検査をここまで遅らせて、2 つの条件を 1 か所にまとめています。

### 4. 組み立てる

```c:line-numbers=510
            val += (hi<<10) + 0x10000;\
```

`val += (hi << 10) + 0x10000;` で、上位 10 ビット（`hi`）と下位 10 ビット（`val`）をつなぎ、0x10000 を足し戻します。
`😀` なら `hi = 0x3D`、`val = 0xDE00 − 0xDC00 = 0x200` なので、`0x200 + 0xF400 + 0x10000 = 0x1F600` です。

## ここがすごい

- **範囲判定を引き算 1 回に**: 「下限を引いて、符号なしで幅と比べる」のは範囲チェックの定番の技です。下限より小さい値は回り込んで大きくなるので、下側の比較が不要になります。
- **ずらした値をそのまま使い回す**: 判定のために作った `hi`（0xD800 からの距離）は、そのまま上位 10 ビットの値です。2 個目も 0xDC00 を引いた値が、そのまま下位 10 ビットです。判定と計算で同じ値を共有しているので無駄がありません。
- **エラー処理を呼び出し側が決める**: `ERROR` に `goto fail;` などを渡す設計なので、マクロは「不正を見つける」ことに集中し、どう対処するかは使う場所に任せられます。返り値でエラーを返す関数より、呼び出し側のコードが短くなります。
- **読む回数がわかりやすい**: ドキュメントに「`GET_16BIT` は 1 回か 2 回評価される」と明記されています。マクロは引数が何度実行されるかが重要なので、それを約束しているのは親切な設計です。

## まとめ

- `lo <= x <= hi` は、`(unsigned)(x - lo) <= hi - lo` の 1 回の比較にできる。
- 範囲判定のためにずらした値を、そのまま後の計算に使うと無駄がない。
- サロゲートペアは「上位 10 ビット + 下位 10 ビット + 0x10000」で文字番号に戻る。
- マクロにエラー処理の文を渡すと、検出と対処を分けられる。
