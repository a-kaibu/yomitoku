---
title: "文字列をシャッフルする strfry に見る Fisher-Yates"
description: "文字列の文字をランダムに並べ替える GNU 拡張の strfry。後ろの未確定部分から 1 文字選んで入れ替える Fisher-Yates シャッフルと、初回だけ乱数生成器を準備する static 変数の使い方が読める。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 1992-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: string/strfry.c
lines: [23, 52]
format: 2
function: "strfry"
difficulty: 2
tags: [アルゴリズム, 乱数, 文字列処理]
---

## ひとことで

`strfry` は、文字列の文字を **ランダムに並べ替える**（シャッフルする）GNU の拡張関数です。
`char s[] = "abcd"; strfry(s);` とすると、`s` は `"cadb"` や `"bdca"` のような並びになります。文字の種類と数は変わりません。
中身は、配列を偏りなく混ぜる定番の方法 **Fisher-Yates シャッフル** です。

## コード

```c:line-numbers=23
char *
strfry (char *string)
{
  static int init;
  static struct random_data rdata;

  if (!init)
    {
      static char state[32];
      rdata.state = NULL;
      __initstate_r (random_bits (),
		     state, sizeof (state), &rdata);
      init = 1;
    }

  size_t len = strlen (string);
  if (len > 0)
    for (size_t i = 0; i < len - 1; ++i)
      {
	int32_t j;
	__random_r (&rdata, &j);
	j = j % (len - i) + i;

	char c = string[i];
	string[i] = string[j];
	string[j] = c;
      }

  return string;
}
```

## 前提知識

- **C の文字列と配列**: 文字列は `char` の並びで、`string[i]` で `i` 番目の文字を読み書きできます。末尾には `'\0'` があり、`strlen` で長さが分かります。
- **関数内の `static` 変数**: 関数の中で `static` を付けた変数は、関数を抜けても値が残り、プログラム全体で 1 つだけ存在します。初期値を書かなければ 0 で始まります。
- **`struct random_data`**: glibc の再入可能な乱数生成器（`random_r` 系）の状態を入れる構造体です。`rdata.state` のように `.` でメンバ（中の項目）を読み書きします。`&rdata` はその構造体の場所（アドレス）です。
- **`__initstate_r` と `__random_r`**: `initstate_r` / `random_r` の内部名です。前者で状態用のバッファと種（シード）を設定し、後者で 0〜2³¹−1 の乱数を 1 つ取り出します（結果はポインタで受け取ります）。
- **`random_bits()`**: glibc 内部の関数で、時計（`clock_gettime`）の値を混ぜて 32 ビットの値を作ります。種として使います。
- **`%`（剰余）**: 割り算の余りです。`j % 3` は 0, 1, 2 のどれかになります。

## 何をしているか

### 1. 初回だけ乱数生成器を準備する

```c:line-numbers=26
  static int init;
  static struct random_data rdata;

  if (!init)
    {
      static char state[32];
      rdata.state = NULL;
      __initstate_r (random_bits (),
		     state, sizeof (state), &rdata);
      init = 1;
    }
```

`init` と `rdata` は `static` なので、最初の呼び出しでは `init` が 0 です。
このときだけ、32 バイトの `static` なバッファ `state` を状態の置き場として、時計から作った種で乱数生成器を初期化します。`init = 1` にしておくので、2 回目以降はこのブロックを飛ばします。
`rdata.state = NULL` には意味があります。`initstate_r` は、`state` が `NULL` でなければ「前に使っていた状態バッファ」に情報を書き戻すので、それをさせないために空にしておくのです。なお 32 バイトのバッファを渡すと、`initstate_r` は 7 個の 32 ビット値を使う小さめの方式（TYPE_1）を選びます。

### 2. Fisher-Yates シャッフル

```c:line-numbers=38
  size_t len = strlen (string);
  if (len > 0)
    for (size_t i = 0; i < len - 1; ++i)
      {
	int32_t j;
	__random_r (&rdata, &j);
	j = j % (len - i) + i;

	char c = string[i];
	string[i] = string[j];
	string[j] = c;
      }
```

`i` を 0 から `len - 2` まで進めながら、毎回次のことをします。

- 乱数 `j` を取り、`j % (len - i) + i` で **`i` 以上 `len - 1` 以下** の位置を 1 つ選ぶ。
- `string[i]` と `string[j]` を入れ替える。

`"abcd"`（`len = 4`）の例です。

- `i = 0`: 0〜3 から選ぶ。2 が出たら `a` と `c` を入れ替えて `"cbad"`。位置 0 は確定。
- `i = 1`: 1〜3 から選ぶ。3 が出たら `"cdab"`。
- `i = 2`: 2〜3 から選ぶ。2 が出たら自分自身と入れ替えて変化なし。
- 最後の 1 文字は選択肢が 1 つしかないので、ループは `len - 1` 回で終わります。

`len > 0` の確認は、`len` が `size_t`（符号なし）なので、空文字列で `len - 1` を計算すると最大値に一周してしまうのを防いでいます。

## ここがすごい

- **偏りのないシャッフル**: Fisher-Yates は、各位置について「まだ確定していない残りから 1 つ選ぶ」ので、すべての並びが同じ確率で出ます（乱数が完全に一様なら）。よくある間違いは「毎回 0〜`len-1` の全体から選ぶ」書き方で、こうすると並びによって出やすさに偏りが出ます。
- **その場で混ぜる**: 追加の配列を使わず、入れ替えだけで済むので、メモリは文字 1 個ぶんしか使いません。手間は文字数に比例します。
- **遅延初期化**: 乱数生成器の準備を最初の呼び出しまで遅らせているので、`strfry` を使わないプログラムには何のコストもかかりません。
- **トレードオフも読み取れる**: `j % (len - i)` は、乱数の範囲が `len - i` でちょうど割り切れないとき、ごくわずかに小さい値が出やすくなります（剰余による偏り）。また `static` 変数を排他制御なしで使っているので、複数のスレッドから同時に呼ぶことは想定されていません。遊び用の関数としては十分ですが、暗号や公平さが重要な用途には向かないことが、コードから読み取れます。

## まとめ

- 配列のシャッフルは、Fisher-Yates（残りから 1 つ選んで入れ替える）が基本。
- 選ぶ範囲を毎回「未確定の部分」に狭めることが、偏りをなくす鍵。
- 関数内の `static` 変数で、初回だけの準備（遅延初期化）ができる。ただしスレッド安全ではなくなる。
- 符号なしの長さから 1 を引く前には、0 でないことを確かめる。
