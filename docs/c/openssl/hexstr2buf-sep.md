---
title: "「DE:AD:BE:EF」をバイト列に戻す、2 回呼んで使う 16 進デコーダ"
description: "16 進数の文字列をバイト列に変換する内部関数。区切り文字の読み飛ばし、桁数の奇数チェック、出力先がないときは長さだけを数えるモードまで、小さな関数にまとまっている。"
language: c
project: OpenSSL
repo: https://github.com/openssl/openssl
license: Apache-2.0
copyright: "Copyright 2003-2026 The OpenSSL Project Authors. All Rights Reserved."
commit: "aad00a888ccb47ec49afeb7545f2dddf9397fbb5"
file: crypto/o_str.c
lines: [259, 300]
function: "hexstr2buf_sep"
difficulty: 1
tags: [パース, 文字列処理, エラー処理, API設計]
---

## ひとことで

`hexstr2buf_sep` は、`"DEADBEEF"` や `"DE:AD:BE:EF"` のような 16 進数の文字列を、`0xDE 0xAD 0xBE 0xEF` という 4 バイトのデータに変換します。
区切り文字（ここでは `:`）は読み飛ばし、16 進数として正しくない文字や、桁数が奇数の文字列はエラーにします。
さらに、出力先 `buf` に NULL を渡すと **書き込まずに「何バイトになるか」だけを数える** ことができます。

## コード

```c:line-numbers=259
static int hexstr2buf_sep(unsigned char *buf, size_t buf_n, size_t *buflen,
    const char *str, const char sep)
{
    unsigned char *q;
    unsigned char ch, cl;
    int chi, cli;
    const unsigned char *p;
    size_t cnt;

    for (p = (const unsigned char *)str, q = buf, cnt = 0; *p;) {
        ch = *p++;
        /* A separator of CH_ZERO means there is no separator */
        if (ch == sep && sep != CH_ZERO)
            continue;
        cl = *p++;
        if (!cl) {
            ERR_raise(ERR_LIB_CRYPTO, CRYPTO_R_ODD_NUMBER_OF_DIGITS);
            return 0;
        }
        cli = OPENSSL_hexchar2int(cl);
        chi = OPENSSL_hexchar2int(ch);
        if (cli < 0 || chi < 0) {
            ERR_raise(ERR_LIB_CRYPTO, CRYPTO_R_ILLEGAL_HEX_DIGIT);
            return 0;
        }
        cnt++;
        if (q != NULL) {
            if (cnt > buf_n) {
                ERR_raise(ERR_LIB_CRYPTO, CRYPTO_R_TOO_SMALL_BUFFER);
                return 0;
            }
            *q++ = (unsigned char)((chi << 4) | cli);
        }
    }

    if (buflen != NULL)
        *buflen = cnt;
    return 1;
}

/*
 * Given a string of hex digits convert to a buffer
```

`OPENSSL_hexchar2int` は同じファイルの 210〜257 行目にあり、`'0'`〜`'9'`、`'a'`〜`'f'`、`'A'`〜`'F'` を 0〜15 の数に、それ以外を `-1` にする関数です。`CH_ZERO` は 20 行目で `'\0'` と定義されています。

## 前提知識

- **16 進数**: 0〜9 と A〜F（10〜15）の 16 種類の文字で数を表す書き方です。2 文字で 1 バイト（0〜255）を表せます。`"DE"` は 13×16 + 14 = 222 = `0xDE` です。
- **`static`**: この関数をファイルの中だけで使うという意味です。外部には `OPENSSL_hexstr2buf` などの公開関数が、この関数を呼ぶ形で提供されています。
- **ポインタ `p`, `q`**: `p` は入力文字列を 1 文字ずつ指していき、`q` は出力バッファの書き込み位置を指します。`*p++` は「今の文字を読み、次へ進む」です。
- **`size_t *buflen`**: 「結果の長さを書き込む場所」を受け取る引数です。C の関数は値を 1 つしか返せないので、追加の結果はポインタ経由で返すのが定番です。
- **`(chi << 4) | cli`**: `<<` は左シフト（2 進数で桁をずらす）で、4 ビットずらすと 16 倍になります。上位 4 ビットに `chi`、下位 4 ビットに `cli` を並べて 1 バイトを作ります。
- **`ERR_raise(...)`**: OpenSSL のエラーキューにエラーの種類を記録するマクロです。呼び出し側はあとから理由を調べられます。

## 何をしているか

### 1. 1 文字目を読み、区切り文字なら飛ばす（267〜271 行目）

`for` ループは `*p`（今の文字）が 0 でない間、つまり文字列の終わりまで回ります。`ch = *p++` で 1 文字読み、それが区切り文字 `sep` なら `continue` で次へ進みます。`sep` が `'\0'` のときは「区切りなし」の意味なので、この判定をしません。

### 2. 2 文字目を読む（272〜276 行目）

`cl = *p++` でもう 1 文字読みます。ここで文字列が終わっていたら（`cl` が 0）、桁数が奇数なのでエラーです。`"ABC"` を渡すと、`AB` の次に `C` を読んだあと 2 文字目が 0 になり、このエラーになります。

### 3. 2 文字を数に変換する（277〜282 行目）

`OPENSSL_hexchar2int` で 2 文字をそれぞれ 0〜15 に変換します。どちらかが `-1` なら 16 進数ではない文字なのでエラーです。

### 4. バイトを書く、または数えるだけ（283〜290 行目）

`cnt` を 1 増やします。`q` が NULL でなければ、バッファの大きさ `buf_n` を超えていないか確かめてから `(chi << 4) | cli` を書き込みます。`"DE"` なら `chi = 13`、`cli = 14` で、`(13 << 4) | 14 = 0xD0 | 0x0E = 0xDE` です。
`q` が NULL のときは何も書かず、数えるだけです。

### 5. 長さを返す（293〜295 行目）

`buflen` が渡されていれば、変換したバイト数を書き込んで `1`（成功）を返します。

## ここがすごい

- **「2 回呼ぶ」API**: 出力先に NULL を渡すと長さだけがわかるので、呼び出し側は「1 回目で長さを調べてメモリを確保し、2 回目で実際に変換する」ことができます。同じファイルの `ossl_hexstr2buf_sep`（308 行目〜）はまさにこの使い方をしています。変換の規則を 1 か所にまとめられるので、「長さの計算」と「変換」が食い違うバグが起きません。
- **区切り文字の扱いがシンプル**: 区切り文字を読み飛ばすのは「1 文字目の位置」だけです。そのため `"DE:AD"` は通りますが、`"D:EAD"` のように 1 バイトの途中に区切りがあると、`:` が 2 文字目として読まれ、16 進数ではない文字としてエラーになります。区切りの位置を別途検査しなくても、自然に不正な形を弾けます。
- **エラーの理由を区別して記録**: 奇数桁、不正な文字、バッファ不足を別々のエラーコードで記録します。戻り値は 0 か 1 だけですが、原因はエラーキューから調べられます。
- **境界チェックは書き込みの直前**: `cnt > buf_n` の確認は、書き込む直前に毎回行われます。長さだけを数えるモードではバッファがないので、チェックも不要です。

## まとめ

- 16 進数 2 文字は、上位 4 ビットと下位 4 ビットに並べて 1 バイトにする。
- 出力先が NULL なら長さだけを数える設計にすると、確保と変換で同じ関数を使い回せる。
- 1 文字目でだけ区切り文字を飛ばせば、バイトの途中の区切りは自然にエラーになる。
- 失敗の理由は戻り値とは別の仕組み（エラーキュー）で区別して伝える。
