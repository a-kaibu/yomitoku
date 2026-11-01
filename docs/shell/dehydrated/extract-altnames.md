---
title: "証明書署名要求から、ドメイン名の一覧を取り出す"
description: "CSR を検証したうえで、SAN の欄があれば DNS と IP の名前を並べ、無ければ CN を取り出して表示する関数。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [1116, 1142]
function: "extract_altnames"
difficulty: 3
format: 2
tags: [CLI, 文字列処理, 設計パターン]
---
## ひとことで

`extract_altnames` は、**証明書署名要求（CSR）から、証明書に入れるドメイン名の一覧を取り出す** 関数です。SAN の欄があればそれを、無ければ CN の名前を使います。

証明書を発行するには、どの名前を対象にするかを知る必要があります。CSR には、その情報が書かれています。この関数は、その中身を読み取って、扱える形に直します。

## コード

::: code-group

```bash:line-numbers=1116 [日本語訳]
extract_altnames() {
  csrfile="${1}" # csrfile は CSR のファイルのパスです。

  if ! "${OPENSSL}" req -in "${csrfile}" -verify -noout >/dev/null; then
    _exiterr "Certificate signing request isn't valid"
  fi

  reqtext="$("${OPENSSL}" req -in "${csrfile}" -noout -text)"
  if <<<"${reqtext}" grep -q '^[[:space:]]*X509v3 Subject Alternative Name:[[:space:]]*$'; then
    # SAN が使われている場合は、その行を取り出します。
    altnames="$( <<<"${reqtext}" awk '/X509v3 Subject Alternative Name:/{print;getline;print;}' | tail -n1 )"
    # 名前を 1 行に 1 つずつ分けます。
    # shellcheck の警告を抑える指定です。
    altnames="$( <<<"${altnames}" _sed -e 's/^[[:space:]]*//; s/, /\'$'\n''/g' )"
    # 署名できるのは DNS と IP の名前だけです。
    if grep -qEv '^(DNS|IP( Address)*|othername):' <<<"${altnames}"; then
      _exiterr "Certificate signing request contains non-DNS/IP Subject Alternative Names"
    fi
    # DNS: などの接頭辞を取り除きます。
    altnames="$( <<<"${altnames}" _sed -e 's/^(DNS:|IP( Address)*:|othername:<unsupported>)//' )"
    printf "%s" "${altnames}" | tr '\n' ' '
  else
    # SAN が無ければ、CN を取り出します。
    altnames="$( <<<"${reqtext}" grep '^[[:space:]]*Subject:' | _sed -e 's/.*[ /]CN ?= ?([^ /,]*).*/\1/' )"
    printf "%s" "${altnames}"
  fi
}
```

```bash:line-numbers=1116 [原文]
extract_altnames() {
  csrfile="${1}" # path to CSR file

  if ! "${OPENSSL}" req -in "${csrfile}" -verify -noout >/dev/null; then
    _exiterr "Certificate signing request isn't valid"
  fi

  reqtext="$("${OPENSSL}" req -in "${csrfile}" -noout -text)"
  if <<<"${reqtext}" grep -q '^[[:space:]]*X509v3 Subject Alternative Name:[[:space:]]*$'; then
    # SANs used, extract these
    altnames="$( <<<"${reqtext}" awk '/X509v3 Subject Alternative Name:/{print;getline;print;}' | tail -n1 )"
    # split to one per line:
    # shellcheck disable=SC1003
    altnames="$( <<<"${altnames}" _sed -e 's/^[[:space:]]*//; s/, /\'$'\n''/g' )"
    # we can only get DNS/IP: ones signed
    if grep -qEv '^(DNS|IP( Address)*|othername):' <<<"${altnames}"; then
      _exiterr "Certificate signing request contains non-DNS/IP Subject Alternative Names"
    fi
    # strip away the DNS/IP: prefix
    altnames="$( <<<"${altnames}" _sed -e 's/^(DNS:|IP( Address)*:|othername:<unsupported>)//' )"
    printf "%s" "${altnames}" | tr '\n' ' '
  else
    # No SANs, extract CN
    altnames="$( <<<"${reqtext}" grep '^[[:space:]]*Subject:' | _sed -e 's/.*[ /]CN ?= ?([^ /,]*).*/\1/' )"
    printf "%s" "${altnames}"
  fi
}
```

:::

## 前提知識

- **CSR（証明書署名要求）**: 証明書の発行を頼むときに作る、申請のデータです。
- **SAN（Subject Alternative Name）**: 証明書が対象とする、複数の名前の欄です。
- **CN（Common Name）**: 証明書の代表的な名前の欄です。SAN が無いときの代わりに使われます。
- **`openssl req -verify`**: CSR の署名が正しいかを確かめる指定です。
- **`getline`**: awk で、次の行を読み込む命令です。

## 何をしているか

### 1. CSR の正しさを確かめる

```bash:line-numbers=1117
  csrfile="${1}" # csrfile は CSR のファイルのパスです。

  if ! "${OPENSSL}" req -in "${csrfile}" -verify -noout >/dev/null; then
    _exiterr "Certificate signing request isn't valid"
  fi

```

CSR の署名を検証し、正しくなければエラーで止めます。壊れた申請から名前を取らないためです。

### 2. SAN の欄を探す

```bash:line-numbers=1124
  if <<<"${reqtext}" grep -q '^[[:space:]]*X509v3 Subject Alternative Name:[[:space:]]*$'; then
    # SAN が使われている場合は、その行を取り出します。
    altnames="$( <<<"${reqtext}" awk '/X509v3 Subject Alternative Name:/{print;getline;print;}' | tail -n1 )"
    # 名前を 1 行に 1 つずつ分けます。
```

CSR の中身を表示し、SAN の欄があるかを調べます。ある場合は、その行を取り出し、名前の区切りごとに 1 行にします。

### 3. DNS と IP 以外を弾く

```bash:line-numbers=1129
    altnames="$( <<<"${altnames}" _sed -e 's/^[[:space:]]*//; s/, /\'$'\n''/g' )"
    # 署名できるのは DNS と IP の名前だけです。
    if grep -qEv '^(DNS|IP( Address)*|othername):' <<<"${altnames}"; then
      _exiterr "Certificate signing request contains non-DNS/IP Subject Alternative Names"
    fi
```

DNS と IP 以外の種類の名前が混じっていたら、エラーで止めます。この仕組みで扱えるのは、DNS と IP の名前だけだからです。

### 4. 接頭辞を外して並べる

```bash:line-numbers=1135
    altnames="$( <<<"${altnames}" _sed -e 's/^(DNS:|IP( Address)*:|othername:<unsupported>)//' )"
    printf "%s" "${altnames}" | tr '\n' ' '
  else
```

`DNS:` などの接頭辞を取り除き、名前を空白区切りの 1 行にして表示します。

### 5. SAN が無ければ CN を使う

```bash:line-numbers=1138
    # SAN が無ければ、CN を取り出します。
    altnames="$( <<<"${reqtext}" grep '^[[:space:]]*Subject:' | _sed -e 's/.*[ /]CN ?= ?([^ /,]*).*/\1/' )"
    printf "%s" "${altnames}"
  fi
```

SAN が無い場合は、Subject の欄から CN を取り出して表示します。

## ここがすごい

- **入力を信用しない**: 署名の検証を最初に行うので、壊れた申請から誤った名前を使いません。
- **扱えない種類を明確に拒む**: 対応していない名前が混じると、理由を示して止めます。
- **代わりの経路を持つ**: SAN が無くても、CN から名前を取り出して処理を続けられます。

## まとめ

- 外部からの申請は、まず署名を検証してから中身を使う。
- 扱えない種類のデータは、黙って捨てずに止めると問題に気づける。
- 主な情報が無いときの代わりを用意すると、処理が途切れにくい。
