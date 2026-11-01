---
title: "do-while と && の短絡評価で書く「最大 n 文字」の大文字コピー"
description: "文字列を大文字にしながらコピーする小さな関数。ループ条件 1 行に「終端まで」「n 文字まで」の 2 つの停止条件を詰め込んでいる。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/strcase.c
lines: [72, 85]
function: "Curl_strntoupper"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 移植性]
---

## ひとことで

`Curl_strntoupper` は、`src` の文字列を大文字に変換しながら `dest` にコピーします。コピーするのは最大 `n` 文字（終わりのヌル文字も含む）です。`"Content-Type"` を `n = 20` で渡すと `"CONTENT-TYPE"` とヌル文字が書き込まれます。

## コード

::: code-group

```c:line-numbers=72 [日本語訳]
/* src の文字列を大文字にしたものを dest にコピーする。
 * 2 つの文字列は重なっていてもよい。コピーするのは最大 n 文字で
 * （ヌル文字を含む）、上限に達した場合はコピー先の文字列は
 * ヌル文字で終端されない。
 */
void Curl_strntoupper(char *dest, const char *src, size_t n)
{
  if(n < 1)
    return;

  do {
    *dest++ = Curl_raw_toupper(*src);
  } while(*src++ && --n);
}
```

```c:line-numbers=72 [原文]
/* Copy an upper case version of the string from src to dest. The
 * strings may overlap. No more than n characters of the string are copied
 * (including any NUL) and the destination string will NOT be
 * null-terminated if that limit is reached.
 */
void Curl_strntoupper(char *dest, const char *src, size_t n)
{
  if(n < 1)
    return;

  do {
    *dest++ = Curl_raw_toupper(*src);
  } while(*src++ && --n);
}
```

:::

大文字への変換は `lib/strcase.h` にある小さな関数で、256 要素の表を引くだけです。

<!-- source: lib/strcase.h -->
```c:line-numbers=37
static CURL_INLINE char Curl_raw_toupper(char in)
{
  return (char)Curl_touppermap[(unsigned char)in];
}
```

## 前提知識

- **ポインタ**: `char *dest` は「文字が並ぶ場所を指す値」です。`*dest` でその場所の 1 文字を読み書きでき、`dest++` でとなりの文字に進みます。
- **`*dest++ = x`**: 「`dest` が指す場所に `x` を書き、そのあと `dest` を 1 つ進める」という意味です。`++` が後ろにあるので、進むのは書き込みの後です。
- **`*src++`**: 同様に「今の文字を読んでから進む」です。式の値は進む前の文字になります。
- **`size_t`**: 長さや個数を表す、負にならない（符号なし）整数型です。
- **`do { ... } while(条件);`**: 本体を先に 1 回実行してから条件を調べるループです。最低 1 回は必ず回ります。
- **`&&` の短絡評価**: `A && B` は、`A` が偽なら `B` を評価しません。ここでは「`B` を評価するかどうか」で `--n` を実行するかが変わります。
- **`--n`**: `n` を 1 減らし、減らした後の値を返します。0 になれば偽です。
- **`unsigned char` へのキャスト**: `char` は環境によっては負の値になります。表の添字に負の数を使うと範囲外を読むので、0〜255 の `unsigned char` に直してから引きます。

## 何をしているか

### 1. n が 0 なら何もしない

```c:line-numbers=79
  if(n < 1)
    return;
```

`do-while` は最低 1 回動くので、`n` が 0 のときに 1 文字書いてしまわないよう、先に抜けておきます。

### 2. 1 文字変換して書く

```c:line-numbers=83
    *dest++ = Curl_raw_toupper(*src);
```

`*dest++ = Curl_raw_toupper(*src);` で、`src` の今の文字を大文字にして `dest` に書き、`dest` を進めます。`src` はここではまだ進めません。

### 3. 続けるかどうかを 1 行で判断

```c:line-numbers=84
  } while(*src++ && --n);
```

`while(*src++ && --n);` が停止条件のすべてです。

- `*src++` で今の文字を見て、`src` を次に進めます。今の文字がヌル文字なら偽になり、ここで終わります。ヌル文字もすでにループ本体で書いてあるので、`dest` はきちんと終端されます。
- 今の文字がヌル文字でなければ `--n` に進み、残り回数を減らします。0 になったら終わります。

`src = "ab"`, `n = 10` で追うと、`'A'` を書く → `'a'` は 0 でない、`n = 9` → `'B'` を書く → `n = 8` → ヌル文字を書く → `*src` が 0 なので終了、となります。`n = 2` なら `'A'`, `'B'` を書いた時点で `n` が 0 になり、ヌル文字は書かれません。関数の前のコメントにある「上限に達したら終端されない」はこの動きのことです。

## ここがすごい

- **書いてから判定する順番**: 終わりのヌル文字もコピー対象に含めたいので、「書く → 判定」の `do-while` がぴったりはまっています。`while` で書くと、ヌル文字だけ別に書き足す処理が必要になります。
- **短絡評価で n の減らしすぎを防ぐ**: 終端に来たときは `--n` が評価されません。`n` を余計に減らさない、という細かい正確さが 1 行に収まっています。
- **ロケールに左右されない変換**: C 標準の `toupper()` は「ロケール」（言語や地域の設定）によって結果が変わることがあります。curl は HTTP ヘッダ名のように ASCII だけを扱う場面で使うため、自前の表で常に同じ結果を返します。`strcase.h` のコメントも、`<ctype.h>` の関数はロケールで振る舞いが変わるから使うな、と注意しています。
- **重なっても動く**: 1 文字読んでその場で書くので、`dest` と `src` が同じ場所でも（その場で大文字化しても）正しく動きます。コメントにも「重なってもよい」と明記されています。

## まとめ

- 終端文字まで含めて処理したいときは `do-while` が自然に書ける。
- `&&` の短絡評価を使うと、「終わったら残り回数を減らさない」を自然に表現できる。
- 表引きで大文字化すると速く、ロケールにも左右されない。
- 「上限に達したら終端しない」のような仕様はコメントで明示しておく。
