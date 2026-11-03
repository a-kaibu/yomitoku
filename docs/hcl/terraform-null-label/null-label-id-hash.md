---
title: "長すぎる ID を md5 のハッシュで短く切り詰める"
description: "Cloud Posse の null-label が、id_length_limit を超えた ID を、先頭部分と md5 ハッシュを組み合わせて短くする処理。数字を使えない場面にも対応する工夫がある。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [161, 166]
format: 2
function: "locals（id_hash・id_short・id）"
difficulty: 2
tags: ["ハッシュ", "文字列処理"]
---

## ひとことで
この部分は、ID が `id_length_limit` より長くなったときに、先頭の部分と短いハッシュを組み合わせて上限内に収めます。ハッシュは `md5` で作り、同じ入力からは必ず同じ値が出るので、同じ ID はいつも同じ短い形になります。

## コード
::: code-group

```hcl:line-numbers=161 [日本語訳]
  id_hash_plus = "${md5(local.id_full)}qrstuvwxyz"
  id_hash_case = local.label_value_case == "title" ? title(local.id_hash_plus) : local.label_value_case == "upper" ? upper(local.id_hash_plus) : local.label_value_case == "lower" ? lower(local.id_hash_plus) : local.id_hash_plus
  id_hash      = replace(local.id_hash_case, local.regex_replace_chars, local.replacement)
  # 切り詰めた ID の末尾にハッシュを付けて、短い ID を作る
  id_short = substr("${local.id_truncated}${local.id_hash}", 0, local.id_length_limit)
  id       = local.id_length_limit != 0 && length(local.id_full) > local.id_length_limit ? local.id_short : local.id_full
```

```hcl:line-numbers=161 [原文]
  id_hash_plus = "${md5(local.id_full)}qrstuvwxyz"
  id_hash_case = local.label_value_case == "title" ? title(local.id_hash_plus) : local.label_value_case == "upper" ? upper(local.id_hash_plus) : local.label_value_case == "lower" ? lower(local.id_hash_plus) : local.id_hash_plus
  id_hash      = replace(local.id_hash_case, local.regex_replace_chars, local.replacement)
  # Create the short ID by adding a hash to the end of the truncated ID
  id_short = substr("${local.id_truncated}${local.id_hash}", 0, local.id_length_limit)
  id       = local.id_length_limit != 0 && length(local.id_full) > local.id_length_limit ? local.id_short : local.id_full
```

:::

## 前提知識
- `md5(文字列)`: 文字列から 32 桁の 16 進数の文字列（ハッシュ）を作る関数です。同じ入力からは同じ値が出ます。
- `"${...}"` の書き方: 文字列の中に式の値を埋め込みます。
- `substr(文字列, 開始位置, 長さ)`: 文字列の一部を取り出す関数です。位置は 0 から数えます。
- `replace(文字列, 正規表現, 置き換え)`: 正規表現に合う文字を置き換えます。
- 三項演算子の連鎖: `条件1 ? 値1 : 条件2 ? 値2 : 値3` のように、条件を順に調べます。
- `local.id_full`: 区切り文字でつないだ、長さの制限なしの ID です。

## 何をしているか
### 1. 大文字小文字をそろえたハッシュ文字列を作る
```hcl:line-numbers=161
  id_hash_plus = "${md5(local.id_full)}qrstuvwxyz"
  id_hash_case = local.label_value_case == "title" ? title(local.id_hash_plus) : local.label_value_case == "upper" ? upper(local.id_hash_plus) : local.label_value_case == "lower" ? lower(local.id_hash_plus) : local.id_hash_plus
  id_hash      = replace(local.id_hash_case, local.regex_replace_chars, local.replacement)
```

`id_hash_plus` は、`id_full` の md5 の後ろに `qrstuvwxyz` を付けた文字列です。このモジュールの注記によれば、数字を使えない場面があるため、末尾に英字の列を足してあります。`id_hash_case` では `label_value_case` の設定に合わせて大文字小文字を変え、最後に `replace` で `regex_replace_chars` に合わない文字を消します。

### 2. 短い ID を作る
```hcl:line-numbers=165
  id_short = substr("${local.id_truncated}${local.id_hash}", 0, local.id_length_limit)
  id       = local.id_length_limit != 0 && length(local.id_full) > local.id_length_limit ? local.id_short : local.id_full
```

`id_short` は、切り詰めた ID（`id_truncated`）の後ろにハッシュを付け、`substr` で上限の長さに収めたものです。`id` は、上限が 0 でない（つまり制限がある）ときに、`id_full` の長さが上限を超えていれば `id_short` を、超えていなければ `id_full` をそのまま使います。上限に届かない ID は、一切変えられません。

## ここがすごい
ハッシュを付けるのは、切り詰めによって別々の ID が同じ名前になるのを防ぐためです。たとえば長い名前の末尾だけが違う 2 つのリソースは、単に先頭を切ると同じ名前になってしまいます。ハッシュは切る前の全体から作るので、その衝突を避けられます。

また、コメントにあるとおり、数字を使えない用途にも対応するため、ハッシュの後ろに英字の列を足しています。上限を 0 にすれば、この処理は使われず `id_full` がそのまま `id` になるので、制限の無い環境では余計な変換を避けられます。

## まとめ
- 長い名前は、先頭と全体から作ったハッシュで安全に短くできます。
- ハッシュは同じ入力に対して同じ値になるので、ID が毎回変わりません。
- 条件分岐を三項演算子でつなぐと、上限があるかどうかを 1 行で判断できます。

