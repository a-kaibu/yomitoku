---
title: "証明書の共通名として、長さと IP でないことを確かめる"
description: "証明書の CN（共通名）として使える値かを、空でないこと、64 文字以内であること、IP アドレスではないことで判定する関数。"
language: shell
project: "acme.sh"
repo: https://github.com/acmesh-official/acme.sh
license: "GPL-3.0-only"
copyright: "Copyright (c) acme.sh contributors"
commit: "37d064f7b580055d3f2ddf9a9c960f754f3694d6"
file: "acme.sh"
lines: [1316, 1325]
function: "_is_valid_cn"
difficulty: 1
format: 2
tags: [防御的プログラミング, ネットワーク, API設計]
---
## ひとことで

`_is_valid_cn 名前` は、証明書の **共通名（CN）** として使える値かを判定する関数です。空でなく、64 文字以下で、IP アドレスの形ではなければ成功を返します。

証明書の共通名は、もともとドメイン名を入れる場所です。IP アドレスを入れると、現在の仕様では扱いにくくなります。そこで、この関数は CN に入れてよいかを、先に確かめています。

## コード

```bash:line-numbers=1316
_is_valid_cn() {
  _cn_v="$1"
  if [ -z "$_cn_v" ] || [ "${#_cn_v}" -gt 64 ]; then
    return 1
  fi
  if _isIP "$_cn_v"; then
    return 1
  fi
  return 0
}
```

## 前提知識

- **共通名（CN）**: 証明書が対象とする名前を表す項目です。ドメイン名を入れるのが一般的です。
- **SAN（Subject Alternative Name）**: 証明書で複数の名前を入れるための項目です。IP アドレスも入れられます。CN には、ここでは主にドメイン名を入れます。
- **`${#変数}`**: 変数の文字数を表します。
- **`-gt 64`**: 64 より大きいかを比べます。
- **`_isIP`**: acme.sh が用意している、IP アドレスかを判定する関数です。

## 何をしているか

### 1. 空や長すぎる値を弾く

```bash:line-numbers=1317
  _cn_v="$1"
  if [ -z "$_cn_v" ] || [ "${#_cn_v}" -gt 64 ]; then
    return 1
  fi
```

値が空、または 64 文字を超える場合は、失敗を返します。

### 2. IP アドレスを弾く

```bash:line-numbers=1321
  if _isIP "$_cn_v"; then
    return 1
  fi
```

`_isIP` で IP アドレスの形かを調べ、そうであれば失敗を返します。

### 3. 問題がなければ成功

```bash:line-numbers=1324
  return 0
```

ここまで来たら、CN として使えると判断して成功を返します。

## ここがすごい

- **条件を順に確かめる**: 空、長さ、IP の順に確かめるので、早く結論が出ます。
- **判定だけを担当する**: この関数は、値が使えるかを答えるだけです。使えない場合の表示は、呼ぶ側に任せています。
- **既存の判定を再利用**: IP の判定は、別の関数の `_isIP` を使っています。同じ判定を何度も書かずに済みます。

## まとめ

- 証明書の項目には、長さや形の制限があるので、先に確かめる。
- 判定は 1 つの関数にまとめると、呼ぶ側が簡単になる。
- 既にある判定の関数は、組み合わせて使うと重複が減る。
