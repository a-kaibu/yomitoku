---
title: "速い道と確実な道を使い分けるバージョン比較"
description: "1.2.3 形式のバージョンを比べる関数。単純な形ならシェルの算術だけで比べ、それ以外は awk に任せる。case のパターンで入力の形を見分けるのがうまい。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [989, 1055]
function: "nvm_version_greater"
difficulty: 3
tags: [文字列処理, 最適化, パース]
---
## ひとことで

`nvm_version_greater A B` は、バージョン番号 `A` が `B` より **新しいか** を判定します。`nvm_version_greater 20.1.0 18.19.1` は成功、`nvm_version_greater 1.9.0 1.10.0` は失敗です（`9 < 10` なので）。3 つ目の引数に `1` を渡すと「同じでもよい（以上）」の比較になります。

おもしろいのは **2 段構え** になっている点です。`20.1.0` のような単純な形なら、シェルの中だけで高速に比べます。それ以外の形（`v20`、`1.2.3-rc1` など）は、昔からある `awk` 版の比較に任せます。

## コード

```sh:line-numbers=989
nvm_version_greater() {
  local NVM_LEFT
  NVM_LEFT="${1#v}"
  local NVM_RIGHT
  NVM_RIGHT="${2#v}"
  local NVM_PLAIN
  # a third, more complex, argument of `1` (a flag) compares equal versions as true; `0` or
  # no argument compares them as false.
  local NVM_OR_EQUAL
  NVM_OR_EQUAL="${3:-0}"
  NVM_PLAIN='true'

  # `x.y.z` operands are compared in shell arithmetic, which avoids a fork,
  # except when a group is long enough to overflow it; anything else - partial
  # versions, prereleases, and malformed operands - keeps the comparison this
  # function has always made
  case "${NVM_LEFT}" in
    '' | *[!0-9.]* | *..* | .* | *. | *.*.*.*) NVM_PLAIN='false' ;;
    *.*.*) ;;
    *) NVM_PLAIN='false' ;;
  esac
  case "${NVM_RIGHT}" in
    '' | *[!0-9.]* | *..* | .* | *. | *.*.*.*) NVM_PLAIN='false' ;;
    *.*.*) ;;
    *) NVM_PLAIN='false' ;;
  esac

  if [ "${NVM_PLAIN}" = 'true' ] && [ "${#NVM_LEFT}" -lt 19 ] && [ "${#NVM_RIGHT}" -lt 19 ]; then
    local NVM_GROUP
    local NVM_LEFT_GROUP
    local NVM_RIGHT_GROUP
    NVM_GROUP=1
    while [ "${NVM_GROUP}" -le 3 ]; do
      NVM_LEFT_GROUP="${NVM_LEFT%%.*}"
      NVM_LEFT="${NVM_LEFT#*.}"
      NVM_RIGHT_GROUP="${NVM_RIGHT%%.*}"
      NVM_RIGHT="${NVM_RIGHT#*.}"
      if [ "${NVM_LEFT_GROUP}" -lt "${NVM_RIGHT_GROUP}" ]; then
        return 1
      elif [ "${NVM_LEFT_GROUP}" -gt "${NVM_RIGHT_GROUP}" ]; then
        return 0
      fi
      NVM_GROUP=$((NVM_GROUP + 1))
    done
    if [ "${NVM_OR_EQUAL}" = 1 ]; then
      return 0
    fi
    return 1
  fi
  command awk -v or_equal="${NVM_OR_EQUAL}" 'BEGIN {
    if (ARGV[1] == "" || ARGV[2] == "") exit(1)
    split(ARGV[1], a, /\./);
    split(ARGV[2], b, /\./);
    for (i=1; i<=3; i++) {
      if (a[i] && a[i] !~ /^[0-9]+$/) exit(2);
      if (b[i] && b[i] !~ /^[0-9]+$/) {
        # a non-numeric right-hand group (a prerelease): the left is greater,
        # unless equality counts, in which case the comparison below decides
        if (or_equal != 1) { exit(0); }
      }
      if (a[i] < b[i]) exit(3);
      else if (a[i] > b[i]) exit(0);
    }
    if (or_equal == 1) { exit(0); }
    exit(4)
  }' "${NVM_LEFT}" "${NVM_RIGHT}"
}
```

## 前提知識

- **`${1#v}`**: 引数の先頭に `v` があれば取り除きます（`v20.1.0` → `20.1.0`）。
- **`${3:-0}`**: 3 番目の引数が無ければ `0` を使います。
- **`case` のパターン**: `*` は任意の文字列、`[!0-9.]` は「数字とドット以外の 1 文字」です。`|` で複数のパターンを並べられます。上から順に照合し、最初に一致したものだけを実行します。
- **`${#var}`**: 値の文字数です。
- **`${var%%.*}` / `${var#*.}`**: `%%.*` は最初のドットから後ろを全部削る（先頭の数字だけが残る）、`#*.` は最初のドットまでを削る（残りの部分が残る）操作です。
- **`[ a -lt b ]` / `-gt`**: 数値の「より小さい」「より大きい」の比較です。
- **`$(( ... ))`**: シェルの算術式です。
- **終了ステータスで答えを返す**: `return 0` が「はい（A のほうが新しい）」、`return 1` が「いいえ」です。awk の `exit(n)` も同じく終了ステータスになります。

## 何をしているか

### 1. 準備（990〜999 行目）

両方の先頭の `v` を取り、`NVM_OR_EQUAL`（以上の比較か）を決めます。

### 2. 形を見分ける（1005〜1014 行目）

左右それぞれを `case` で調べ、**ちょうど「数字.数字.数字」の形か** を判定します。最初の行のパターンは「だめな形」の一覧です。

- `''` … 空
- `*[!0-9.]*` … 数字とドット以外が入っている（`-rc1` など）
- `*..*` … ドットが連続
- `.*` / `*.` … ドットで始まる・終わる
- `*.*.*.*` … ドットが 3 つ以上

これらに当てはまらず、`*.*.*`（ドットが 2 つ）に一致すれば合格です。それ以外（`20` や `20.1`）は `*)` に落ちて不合格になります。

### 3. 速い道: シェルの算術で比べる（1016〜1037 行目）

両方が合格で、しかも 19 文字未満なら、ドットで区切った数字を 1 つずつ比べます。`20.1.0` と `18.19.1` なら、最初の `20` と `18` を比べた時点で `20 > 18` なので `return 0` です。3 つとも同じなら、`NVM_OR_EQUAL` に応じて結果を決めます。

19 文字未満という条件は、1002 行目のコメントにあるとおり桁あふれ対策です。シェルの算術は普通 64 ビット整数（最大 19 桁）なので、それより長い数字が来ると正しく比べられません。

### 4. 確実な道: awk で比べる（1038〜1054 行目）

それ以外は awk に任せます。`split` でドット区切りの配列にし、1 つずつ比べます。プレリリース（数字以外の部分）が右側にある場合は左が大きいとみなすなど、従来どおりの細かいルールが実装されています。

## ここがすごい

- **よくある場合だけを速くする**: nvm はバージョンの一覧を並べたり絞り込んだりするときに、この比較を何百回も呼びます。毎回 `awk` を起動するとそのたびにプロセスが作られて遅くなります。ほとんどの入力は `20.1.0` のような単純な形なので、そこだけシェル内で済ませるだけで大きな効果があります。
- **「確実に安全なとき」だけ速い道を使う**: `case` のパターンで入力の形を厳しく確かめ、少しでも怪しければ従来の awk 版に回します。これにより、**結果を一切変えずに** 高速化できています（1003〜1004 行目のコメント）。
- **パターンを「だめな形の一覧」として書く**: 正規表現が使えない `case` でも、否定の条件を列挙することで「数字.数字.数字」だけを通すフィルタを作っています。
- **桁あふれまで考えている**: 長さのチェックを入れたことで、極端な入力でも算術エラーや誤判定が起きません。

## まとめ

- 速い処理は「確実に正しく動く入力」に限定し、それ以外は既存の確実な処理に回すと、安全に高速化できる。
- `case` の否定パターンを並べると、正規表現なしで入力の形を検査できる。
- シェルでループの中から外部コマンドを呼ぶと遅くなりやすい。
