---
title: "掛け算する前にあふれを見抜く ― 8・10・16 進数を 1 本で読む数値パーサ"
description: "curl の数値読み取りの中核。「この値以下なら安全に掛けられる」という境界 cutoff を先に計算し、ふだんは割り算なしで高速に進む。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/strparse.c
lines: [169, 209]
function: "str_num_base"
difficulty: 3
format: 2
tags: [パース, 防御的プログラミング, 数値計算]
---

## ひとことで

`str_num_base` は、文字列の先頭から 8 進・10 進・16 進の数字を読み取り、整数にします。上限 `max` を超えそうになったら、**実際に掛け算してあふれる前に**それを検出してエラーを返します。`"8080/index"` を 10 進数、`max = 65535` で読めば、`8080` を取り出してポインタを `/` の位置まで進めます。

## コード

::: code-group

```c:line-numbers=169 [日本語訳]
/* 0x の接頭辞にも先頭の空白にも対応しない */
static int str_num_base(const char **linep, curl_off_t *nump, curl_off_t max,
                        int base) /* 8、10、16 のどれか。それ以外は不可 */
{
  curl_off_t num = 0;
  const char *p;
  int m = (base == 10) ? '9' :   /* ありうる最大の数字 */
    (base == 16) ? 'f' : '7';
  DEBUGASSERT(linep && *linep && nump);
  DEBUGASSERT((base == 8) || (base == 10) || (base == 16));
  DEBUGASSERT(max >= 0); /* 主に、大きすぎる SIZE_MAX を捕まえるため */
  *nump = 0;
  p = *linep;
  if(!valid_digit(*p, m))
    return STRE_NO_NUM;
  if(max < base) {
    /* max が小さい場合は確認方法が違うので特別扱いする */
    do {
      int n = curlx_hexval(*p++);
      num = (num * base) + n;
      if(num > max)
        return STRE_OVERFLOW;
    } while(valid_digit(*p, m));
  }
  else {
    curl_off_t cutoff = (max - (base - 1)) / base;
    while(valid_digit(*p, m)) {
      if(num <= cutoff)
        num = (num * base) + curlx_hexval(*p++);
      else {
        int n = curlx_hexval(*p++);
        if(num > ((max - n) / base))
          return STRE_OVERFLOW;
        num = (num * base) + n;
      }
    }
  }
  *nump = num;
  *linep = p;
  return STRE_OK;
}
```

```c:line-numbers=169 [原文]
/* no support for 0x prefix nor leading spaces */
static int str_num_base(const char **linep, curl_off_t *nump, curl_off_t max,
                        int base) /* 8, 10 or 16, nothing else */
{
  curl_off_t num = 0;
  const char *p;
  int m = (base == 10) ? '9' :   /* the largest digit possible */
    (base == 16) ? 'f' : '7';
  DEBUGASSERT(linep && *linep && nump);
  DEBUGASSERT((base == 8) || (base == 10) || (base == 16));
  DEBUGASSERT(max >= 0); /* mostly to catch SIZE_MAX, which is too large */
  *nump = 0;
  p = *linep;
  if(!valid_digit(*p, m))
    return STRE_NO_NUM;
  if(max < base) {
    /* special-case low max scenario because check needs to be different */
    do {
      int n = curlx_hexval(*p++);
      num = (num * base) + n;
      if(num > max)
        return STRE_OVERFLOW;
    } while(valid_digit(*p, m));
  }
  else {
    curl_off_t cutoff = (max - (base - 1)) / base;
    while(valid_digit(*p, m)) {
      if(num <= cutoff)
        num = (num * base) + curlx_hexval(*p++);
      else {
        int n = curlx_hexval(*p++);
        if(num > ((max - n) / base))
          return STRE_OVERFLOW;
        num = (num * base) + n;
      }
    }
  }
  *nump = num;
  *linep = p;
  return STRE_OK;
}
```

:::

数字かどうかの判定と値の変換は、同じ表を共有しています。

```c:line-numbers=155
#define valid_digit(x, m) \
  (((x) >= '0') && ((x) <= (m)) && curlx_hexasciitable[(x) - '0'])

/* We use 16 for the zero index (and the necessary bitwise AND in the loop)
   to be able to have a non-zero value there to make valid_digit() able to
   use the info */
const unsigned char curlx_hexasciitable[] = {
  16, 1, 2, 3, 4, 5, 6, 7, 8, 9, /* 0x30: 0 - 9 */
  0, 0, 0, 0, 0, 0, 0,
  10, 11, 12, 13, 14, 15,        /* 0x41: A - F */
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  10, 11, 12, 13, 14, 15         /* 0x61: a - f */
};
```

<!-- source: lib/curlx/strparse.h -->
```c:line-numbers=111
#define curlx_hexval(x) (unsigned char)(curlx_hexasciitable[(x) - '0'] & 0x0f)
```

## 前提知識

- **`const char **linep`（ポインタのポインタ）**: 「文字列の読み取り位置」を指すポインタを、さらに指しています。関数の中で `*linep = p;` と書くと、呼び出し元の読み取り位置そのものを進められます。
- **`curl_off_t`**: curl が使う 64 ビットの符号付き整数型です。大きなファイルサイズも表せます。
- **`*nump = 0`**: `nump` は結果を書き込む場所を指すポインタで、`*nump` に代入すると呼び出し元の変数に値が入ります。C で「戻り値を複数返す」ときの定番です。
- **三項演算子 `a ? b : c`**: `a` が真なら `b`、偽なら `c` になります。進数ごとに最大の数字を決める部分は 2 段に重ねています。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件をチェックし、偽ならプログラムを止めるマクロです。製品版では消えます。
- **整数の割り算**: C の `/` は小数点以下を切り捨てます。`(255 - 9) / 10` は 24 です。
- **オーバーフロー**: 整数が型の上限を超えることです。符号付き整数でこれが起きると C では「未定義動作」（何が起きても文句を言えない状態）になるので、起きる前に止める必要があります。

## 何をしているか

### 1. 進数ごとの「最大の数字」を決める

```c:line-numbers=175
  int m = (base == 10) ? '9' :   /* the largest digit possible */
    (base == 16) ? 'f' : '7';
```

10 進なら `'9'`、16 進なら `'f'`、8 進なら `'7'` を `m` にします。`valid_digit` は「`'0'` 以上 `m` 以下で、表の値が 0 でない」文字を数字と認めます。16 進のとき `'9'` と `'a'` の間にある `':'` や `'G'` は表の値が 0 なので弾かれます。

### 2. 最初の 1 文字が数字でなければ失敗

```c:line-numbers=182
  if(!valid_digit(*p, m))
    return STRE_NO_NUM;
```

空文字列や `"-5"` は `STRE_NO_NUM` を返します。

### 3. ふつうの場合: cutoff で高速に

```c:line-numbers=193
  else {
    curl_off_t cutoff = (max - (base - 1)) / base;
    while(valid_digit(*p, m)) {
      if(num <= cutoff)
        num = (num * base) + curlx_hexval(*p++);
      else {
        int n = curlx_hexval(*p++);
        if(num > ((max - n) / base))
          return STRE_OVERFLOW;
        num = (num * base) + n;
      }
    }
  }
```

`cutoff = (max - (base - 1)) / base` は「`num` がこの値以下なら、どんな数字を足してもあふれない」という境界です。`max = 255`、10 進なら `cutoff = 246 / 10 = 24` です。`num` が 24 以下なら `24 × 10 + 9 = 249` で 255 を超えないので、チェックなしに計算します。

`num` が 25 以上になったときだけ、`else` の中で `num > (max - n) / base` を調べます。`num = 25` のとき、次の数字が 5 なら `(255 - 5) / 10 = 25` で 25 は超えないので 255 になります。数字が 6 なら `(255 - 6) / 10 = 24` で、25 は超えるので `STRE_OVERFLOW` を返します。

### 4. max が小さい場合は別の道

```c:line-numbers=184
  if(max < base) {
    /* special-case low max scenario because check needs to be different */
    do {
      int n = curlx_hexval(*p++);
      num = (num * base) + n;
      if(num > max)
        return STRE_OVERFLOW;
    } while(valid_digit(*p, m));
  }
```

`max` が進数より小さい（たとえば 10 進で `max = 5`）と、cutoff の式は `(5 - 9) / 10` で 0 になってしまいます。すると最初の数字が `"7"` でも「`num = 0` は cutoff 以下」として素通りしてしまいます。そこで `if(max < base)` で場合を分け、1 桁ごとに素直に計算して `num > max` を確かめます。数が小さいので、計算してから比べてもあふれません。

### 5. 結果と読み取り位置を返す

```c:line-numbers=206
  *nump = num;
  *linep = p;
  return STRE_OK;
```

成功したときだけ `*nump` に値を入れ、`*linep` を数字の直後まで進めます。

## ここがすごい

- **割り算をほとんどしない**: あふれチェックを毎桁 `num > (max - n) / base` で行うと、桁ごとに割り算が要ります。cutoff を一度だけ計算しておけば、上限に近づくまでは比較 1 回で済みます。
- **計算の前に判定する**: 「掛けてから大きすぎたら戻す」方式は、あふれた時点で未定義動作です。この関数は常に「掛けても安全か」を先に確かめています。
- **境界のずれを見落とさない**: cutoff の式は `max` が小さいと破綻します。その特別な場合をコメント付きで分けているのは、テストで見つけにくい落とし穴をきちんと塞いだ跡です。
- **表 1 枚で判定と変換を兼ねる**: `'0'` の値を 0 ではなく 16 にしておき、変換時に `& 0x0f` で下 4 ビットだけ取り出します。これで「0 なら数字ではない」という判定と、`'0'` → 0 の変換が両立します（表の直前のコメントのとおり）。
- **1 つの関数で 3 つの進数**: `curlx_str_number` などの公開関数は、この関数に進数を渡すだけの薄い入口です。

## まとめ

- 整数のあふれは「計算する前」に防ぐ。
- `cutoff` を先に求めておくと、ふだんの桁は比較 1 回で処理できる。
- 境界の計算式が成り立たない入力（小さい上限など）を別に扱う。
- 表の値に「目印」を混ぜ、マスクで取り出すと、判定と変換を 1 枚の表で兼ねられる。
