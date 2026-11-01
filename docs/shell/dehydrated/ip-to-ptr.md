---
title: "IP アドレスを逆引き用の名前に変える"
description: "IPv4 は 1.2.3.4 を 4.3.2.1.in-addr.arpa に、IPv6 は ip6.arpa 形式に変換する関数。証明書の ALPN で IP を扱うための準備に使われる。"
language: shell
project: "dehydrated"
repo: https://github.com/dehydrated-io/dehydrated
license: "MIT"
copyright: "Copyright (c) 2015-2021 Lukas Schauer"
commit: "48866b0e85b474e3971d6425a14212608c355c1c"
file: "dehydrated"
lines: [246, 253]
function: "ip_to_ptr"
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, 数値計算]
---
## ひとことで

`ip_to_ptr` は、IP アドレスを **逆引き（PTR）用の名前** に変える関数です。標準入力から IP アドレスを 1 つ受け取り、変換した文字列を表示します。

たとえば IPv4 の `192.0.2.1` は `1.2.0.192.in-addr.arpa` になります。数字を逆順に並べて末尾に `in-addr.arpa` を付けると、DNS で「この IP の名前は何か」を問い合わせるときの形になります。

この変換は、証明書を発行するときに IP アドレスを検証する準備として使われます。

## コード

```bash:line-numbers=246
ip_to_ptr() {
  ip="$(cat)"
  if [[ "${ip}" =~ : ]]; then
    printf "%sip6.arpa" "$(printf "%s" "${ip}" | awk -F: 'BEGIN {OFS=""; }{addCount = 9 - NF; for(i=1; i<=NF;i++){if(length($i) == 0){ for(j=1;j<=addCount;j++){$i = ($i "0000");} } else { $i = substr(("0000" $i), length($i)+5-4);}}; print}' | rev | sed -e "s/./&./g")"
  else
    printf "%s.in-addr.arpa" "$(printf "%s" "${ip}" | awk -F. '{print $4"."$3"." $2"."$1}')"
  fi
}
```

## 前提知識

- **逆引き（PTR）**: DNS で、IP アドレスから名前を探す仕組みです。`in-addr.arpa`（IPv4）や `ip6.arpa`（IPv6）という特別なドメインの下で行われます。
- **`cat`**: 標準入力の内容をそのまま出力します。ここでは、パイプで渡された IP アドレスを読むために使っています。
- **`[[ 文字列 =~ : ]]`**: 文字列にコロンを含むかを調べます。IPv6 のアドレスはコロンで区切られるので、これで IPv4 と IPv6 を見分けています。
- **`awk -F.`**: 区切り文字を `.` にして、各要素を `$1` `$2`… で取り出します。
- **`rev`**: 1 行の文字を逆順にする、標準的なコマンドです。

## 何をしているか

### 1. 入力を読む

```bash:line-numbers=247
  ip="$(cat)"
```

パイプから IP アドレスを読み込み、`ip` に入れます。

### 2. IPv6 の場合

```bash:line-numbers=249
    printf "%sip6.arpa" "$(printf "%s" "${ip}" | awk -F: 'BEGIN {OFS=""; }{addCount = 9 - NF; for(i=1; i<=NF;i++){if(length($i) == 0){ for(j=1;j<=addCount;j++){$i = ($i "0000");} } else { $i = substr(("0000" $i), length($i)+5-4);}}; print}' | rev | sed -e "s/./&./g")"
```

コロンを含む場合は、まず `ipv6_expand` と同じような考え方で、省略された 0 を補って 8 つの区間にそろえます。その後、各区間を 4 桁にして、文字を 1 つずつ `.` で区切り、`ip6.arpa` を付けます。

### 3. IPv4 の場合

```bash:line-numbers=251
    printf "%s.in-addr.arpa" "$(printf "%s" "${ip}" | awk -F. '{print $4"."$3"." $2"."$1}')"
```

IPv4 では、`awk -F.` で 4 つの数字を取り出し、逆順に並べ直します。`192.0.2.1` の場合は `1.2.0.192` になり、最後に `.in-addr.arpa` が付きます。

## ここがすごい

- **IPv4 と IPv6 を 1 つの関数で扱う**: 区切りがドットかコロンかを判定するだけで、2 つの形式を切り替えています。
- **逆順の作り方が単純**: IPv4 は、4 つの数字を並べ替えるだけです。DNS の仕組みに合わせて、必要最小限の処理になっています。
- **標準的なツールだけで実装**: awk、sed、rev という、どの Unix 系にもあるツールを組み合わせています。

## まとめ

- IP アドレスの逆引き名は、要素を逆順に並べて特別なドメインを付けると作れる。
- 区切り文字で IPv4 と IPv6 を見分けられる。
- 標準的なツールの組み合わせで、ネットワークの処理も書ける。
