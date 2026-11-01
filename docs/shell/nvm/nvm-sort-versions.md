---
title: "並べ替え用のキーを先頭に付けて sort に任せる"
description: "v20.1.0 や v22.0.0-rc.1 が混ざった一覧を、セマンティックバージョニングの順に並べる。awk で比較用のキーを作って sort し、最後に cut で外す「装飾・並べ替え・除去」の手法。"
language: shell
project: "nvm"
repo: https://github.com/nvm-sh/nvm
license: "MIT"
copyright: "Copyright (c) 2010 Tim Caswell; Copyright (c) 2014 Jordan Harband"
commit: "5e38bc0caed342356ffd26eb21e0e9b995ac228b"
file: "nvm.sh"
lines: [2301, 2332]
function: "nvm_sort_versions"
difficulty: 3
format: 2
tags: [ソート, 文字列処理, アルゴリズム]
---
## ひとことで

`nvm_sort_versions` は、標準入力から受け取ったバージョンの一覧を **正しいバージョン順に並べ替える** 関数です。

```
入力: v20.1.0  v9.11.2  v20.0.0-rc.2  v20.0.0  v20.0.0-rc.10
出力: v9.11.2  v20.0.0-rc.2  v20.0.0-rc.10  v20.0.0  v20.1.0
```

`sort` を普通に使うと、`v9` が `v20` より後ろに来たり、`rc.10` が `rc.2` より前に来たりします。この関数は awk で **並べ替え用のキー** を各行の前に付けてから `sort` し、最後にキーを外します。

## コード

```sh:line-numbers=2301
nvm_sort_versions() {
  command awk -v collapse="${1-}" '{
    version = $1;
    sub(/\.(node|iojs)$/, "", version);
    sub(/^(iojs-)?v/, "", version);
    prerelease = "~";
    dash = index(version, "-");
    if (dash) {
      count = split(substr(version, dash + 1), identifiers, ".");
      prerelease = "";
      for (i = 1; i <= count; i++) {
        identifier = identifiers[i];
        if (identifier ~ /^[0-9]+$/) {
          sub(/^0+/, "", identifier);
          while (length(identifier) < 20) { identifier = "0" identifier }
          identifier = "0" identifier;
        } else {
          identifier = "1" identifier;
        }
        prerelease = prerelease identifier "!";
      }
      if (collapse && version !~ /^[0-9]+\.[0-9]+\.[0-9]+-alpha\.[0-9]+\.[0-9]+\.[0-9]+$/) { prerelease = "0" }
      version = substr(version, 1, dash - 1);
    }
    split(version, parts, ".");
    printf "%d %d %d %s\t%s\n", parts[1], parts[2], parts[3], prerelease, $0;
  }' | if [ "${1-}" = 1 ]; then
    LC_ALL=C command sort -u -k 1,1n -k 2,2n -k 3,3n -k 4,4 | command cut -f 2-
  else
    LC_ALL=C command sort -k 1,1n -k 2,2n -k 3,3n -k 4,4 | command cut -f 2- | command uniq
  fi
}
```

## 前提知識

- **セマンティックバージョニング**: `メジャー.マイナー.パッチ` の 3 つの数で表すバージョンの付け方です。`-rc.1` のようなプレリリースは、同じ番号の正式版より **前** とみなします。
- **awk の `sub(/正規表現/, 置換, 変数)`**: 変数の中の最初の一致を置き換えます。
- **`index(s, "-")`**: `s` の中の `-` の位置です。無ければ 0。
- **`split(s, 配列, ".")`**: ドットで分割して配列に入れ、要素数を返します。
- **`printf "%d %d %d %s\t%s\n"`**: 3 つの数、プレリリースのキー、タブ、元の行、の形で出力します。
- **`sort -k 1,1n -k 4,4`**: 1 列目を数値順（`n`）で、同じなら 4 列目を文字列順で並べます。`-u` は重複を取り除きます。
- **`LC_ALL=C`**: ロケールの影響を受けない、バイト値の順で比べる指定です。
- **`cut -f 2-`**: タブで区切った 2 列目以降（元の行）だけを残します。

## 何をしているか

### 1. 余計な前後を取る

`iojs-v` や `v`、末尾の `.node` などを取り除き、数字の部分だけにします。

### 2. プレリリースのキーを作る

プレリリースが無ければキーは `~` です。`~` は ASCII で英数字より後ろの文字なので、**正式版は同じ番号のプレリリースより後ろ** に並びます。

プレリリースがあれば、`.` で区切った各部分を次のように変換して `!` でつなぎます。

- 数字なら、先頭の 0 を取り、20 桁にゼロ埋めし、前に `0` を付ける（`10` → `0` + `000…0010`）
- 文字なら前に `1` を付ける（`rc` → `1rc`）

数字をゼロ埋めすると、文字列として比べても数値の順になります（`…02` < `…10`）。頭に `0` / `1` を付けることで、セマンティックバージョニングの決まりどおり「数字は文字より前」になります。

### 3. キーを付けて出力

たとえば `v20.0.0-rc.2` は次のような行になります。

```
20 0 0 1rc!0000…0002!	v20.0.0-rc.2
```

### 4. 並べてキーを外す

`sort` で 1〜3 列目を数値として、4 列目を文字列として並べ、`cut` でキーを捨てます。

## ここがすごい

- **装飾・並べ替え・除去**: 比較が複雑なデータを並べるとき、比較しやすいキーを付けて普通の `sort` に任せ、最後に外す。この手法は「シュワルツ変換」とも呼ばれ、どの言語でも使える強力な考え方です。
- **ASCII の順番を利用**: `~` が英数字より後ろ、`0` が `1` より前、という文字の順番を使って、仕様のルールをそのまま文字列比較に落とし込んでいます。`LC_ALL=C` を付けて、この順番が環境に左右されないようにしているのも大切です。
- **`sort -V` に頼らない**: GNU の `sort -V`（バージョン順）を使えば簡単ですが、macOS などの `sort` には無いことがあります。この関数はどの `sort` でも動きます。

## まとめ

- 複雑な並べ替えは「比較用のキーを作って付ける → 並べる → キーを外す」で解ける。
- 数字をゼロ埋めすると、文字列の比較で数値の順になる。
- `LC_ALL=C` で、文字の並び順を環境に依存しないようにできる。
