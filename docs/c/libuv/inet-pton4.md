---
title: "先頭の 0 も 256 も許さない、IPv4 アドレスの厳しい読み取り"
description: "「192.168.0.1」のような文字列を 4 バイトの IPv4 アドレスに変換する関数。数字を 1 文字ずつ足し込み、2 つのフラグだけで形式の誤りをすべて弾く。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright (c) 2004 by Internet Systems Consortium, Inc. (ISC); Copyright (c) 1996-1999 by Internet Software Consortium; Copyright (c) 2012-2026 by libuv project contributors."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/inet.c
lines: [186, 222]
function: "inet_pton4"
difficulty: 2
format: 2
tags: [ネットワーク, パース, 状態機械, 防御的プログラミング]
---

## ひとことで

`inet_pton4` は、`"192.168.0.1"` のような文字列を、4 バイトの IPv4 アドレス `{192, 168, 0, 1}` に変換する関数です（pton は presentation to network の略）。
1 文字ずつ読みながら、「数字を見たか」「何個目の数か」という 2 つの情報だけで、`256` や `01`、`1..2`、`1.2.3` のような誤った形式をすべて弾きます。
ファイルの先頭に ISC（Internet Systems Consortium）の著作権表示が残る古いコードで、小さな状態機械の好例です。

## コード

```c:line-numbers=186
static int inet_pton4(const char *src, unsigned char *dst) {
  static const char digits[] = "0123456789";
  int saw_digit, octets, ch;
  unsigned char tmp[sizeof(struct in_addr)], *tp;

  saw_digit = 0;
  octets = 0;
  *(tp = tmp) = 0;
  while ((ch = *src++) != '\0') {
    const char *pch;

    if ((pch = strchr(digits, ch)) != NULL) {
      unsigned int nw = *tp * 10 + (pch - digits);

      if (saw_digit && *tp == 0)
        return UV_EINVAL;
      if (nw > 255)
        return UV_EINVAL;
      *tp = nw;
      if (!saw_digit) {
        if (++octets > 4)
          return UV_EINVAL;
        saw_digit = 1;
      }
    } else if (ch == '.' && saw_digit) {
      if (octets == 4)
        return UV_EINVAL;
      *++tp = 0;
      saw_digit = 0;
    } else
      return UV_EINVAL;
  }
  if (octets < 4)
    return UV_EINVAL;
  memcpy(dst, tmp, sizeof(struct in_addr));
  return 0;
}
```

## 前提知識

- **IPv4 アドレス**: 0〜255 の数を 4 つ、`.` で区切って書いた 32 ビットの番号です。
- **`unsigned char`**: 0〜255 を入れられる 1 バイトの整数型です。アドレスの 1 区切り（オクテット）にちょうど合います。
- **`*(tp = tmp) = 0;`**: `tp` に配列 `tmp` の先頭を代入し、同時にその場所へ 0 を書く、という 2 つの処理を 1 行にしたものです。代入は値を持つ式なので、こう書けます。
- **`strchr(文字列, 文字)`**: 文字列の中から文字を探し、見つかればその位置（ポインタ）を、なければ `NULL` を返します。`pch - digits` は、見つかった位置が先頭から何番目か、つまりその数字の値（0〜9）になります。
- **`*++tp = 0`**: `tp` を 1 つ進めてから、そこに 0 を書きます。
- **状態機械**: 「今どういう状況か」を変数で持ち、入力 1 つごとに状況を切り替えながら処理する作り方です。
- **`memcpy(先, 元, バイト数)`**: メモリの内容をコピーします。

## 何をしているか

### 1. 準備

```c:line-numbers=191
  saw_digit = 0;
  octets = 0;
  *(tp = tmp) = 0;
```

`saw_digit` は「今の区切りで数字を見たか」、`octets` は「いくつ目の数まで来たか」です。作業用の `tmp` の先頭を 0 にし、`tp` で指します。

### 2. 数字が来たとき

```c:line-numbers=197
    if ((pch = strchr(digits, ch)) != NULL) {
      unsigned int nw = *tp * 10 + (pch - digits);

      if (saw_digit && *tp == 0)
        return UV_EINVAL;
      if (nw > 255)
        return UV_EINVAL;
      *tp = nw;
      if (!saw_digit) {
        if (++octets > 4)
          return UV_EINVAL;
        saw_digit = 1;
      }
```

数字なら、今の値に 10 を掛けて新しい桁を足し、`nw` に入れます。

- `saw_digit && *tp == 0` … すでに数字を見ていて、値が 0 なら、`0` の後ろにさらに数字が来たということです。`01` のような先頭の 0 を弾きます。
- `nw > 255` … 256 以上は弾きます。`nw` は `unsigned int` で計算しているので、1 バイトにあふれる前に判定できます。
- その区切りで初めての数字なら、`octets` を増やし、5 個目なら弾きます。

### 3. `.` が来たとき

```c:line-numbers=210
    } else if (ch == '.' && saw_digit) {
      if (octets == 4)
        return UV_EINVAL;
      *++tp = 0;
      saw_digit = 0;
```

数字を見た後の `.` だけを受け付けます。すでに 4 個目なら弾きます。`*++tp = 0` で次の区切りへ進み、`saw_digit` を戻します。

### 4. それ以外の文字と最後の確認

```c:line-numbers=215
    } else
      return UV_EINVAL;
  }
  if (octets < 4)
    return UV_EINVAL;
  memcpy(dst, tmp, sizeof(struct in_addr));
  return 0;
```

数字でも正しい `.` でもない文字が来たらエラーです。最後に `octets < 4` なら数が足りないのでエラー。問題なければ `tmp` を `dst` にコピーします。

### 例で追う

- `"10.0.0.1"` → 10、0、0、1 と読めて成功です。
- `"1.2.03.4"` → `0` を読んだあと `3` が来た時点で、`saw_digit` が真で値が 0 なので失敗です。
- `"1..2"` → 2 つ目の `.` のとき `saw_digit` が偽なので失敗です。
- `"1.2.3.4."` → 最後の `.` で `octets == 4` なので失敗です。
- `"300.1.1.1"` → `30` に `0` を足して 300 になった時点で失敗です。

## ここがすごい

- **2 つのフラグで文法全体を表す**: 「数字 1〜3 桁、ただし 0 以外で始まる（0 単独は可）、値は 255 以下、`.` で区切って 4 つ」という規則を、`saw_digit` と `octets` だけで判定しています。正規表現も分割処理もいりません。
- **先頭の 0 を禁止する意味**: 一部の古い実装は `010` を 8 進数（＝8）と解釈します。`010.0.0.1` を 10 番と読むか 8 番と読むかが実装によって違うと、アクセス制御をすり抜けられるおそれがあります。この関数はそもそも先頭の 0 を受け付けないので、あいまいさが生まれません。
- **出力先を最後まで触らない**: 作業用の `tmp` で組み立て、成功したときだけ `dst` にコピーしています。途中で失敗しても、呼び出し側の `dst` に中途半端な値が残りません。
- **IPv6 からも再利用される**: `::ffff:192.0.2.1` のような形式を読むとき、`inet_pton6` は IPv4 部分の解析にこの関数をそのまま使っています。

## まとめ

- 文字列の解析は、小さな状態（フラグ）を持って 1 文字ずつ進めると見通しがよい。
- 数字の文字は `文字 - '0'`（ここでは `strchr` の位置の差）で値に変換できる。
- 範囲チェックは、あふれる前の大きな型で計算してから行う。
- 失敗の可能性がある処理は作業用領域で組み立て、成功時だけ結果を書き込む。
