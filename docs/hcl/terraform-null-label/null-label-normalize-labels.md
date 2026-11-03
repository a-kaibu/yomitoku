---
title: "ラベルの大文字小文字を for 式と三項演算子だけでそろえる"
description: "Cloud Posse の null-label が、名前空間・環境・ステージなどの値を使える文字だけに絞り、大文字小文字の規則も一箇所で決めている仕組み。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [76, 91]
format: 2
function: "locals（normalized_labels・formatted_labels・attributes）"
difficulty: 2
tags: ["文字列処理", "イディオム"]
---

## ひとことで
Terraform のモジュール `terraform-null-label` は、名前空間（namespace）や環境（environment）などのラベル値を、リソース名に使える形へ整えます。このブロックでは、使えない文字を消し、利用者が選んだ規則（既定では小文字）に大文字小文字をそろえます。関数を新しく定義せず、`for` 式と三項演算子だけで書かれているのが特徴です。

## コード
```hcl:line-numbers=76
  string_label_names = ["namespace", "tenant", "environment", "stage", "name"]
  normalized_labels = { for k in local.string_label_names : k =>
    local.input[k] == null ? "" : replace(local.input[k], local.regex_replace_chars, local.replacement)
  }
  normalized_attributes = compact(distinct([for v in local.input.attributes : replace(v, local.regex_replace_chars, local.replacement)]))

  formatted_labels = { for k in local.string_label_names : k => local.label_value_case == "none" ? local.normalized_labels[k] :
    local.label_value_case == "title" ? title(lower(local.normalized_labels[k])) :
    local.label_value_case == "upper" ? upper(local.normalized_labels[k]) : lower(local.normalized_labels[k])
  }

  attributes = compact(distinct([
    for v in local.normalized_attributes : (local.label_value_case == "none" ? v :
      local.label_value_case == "title" ? title(lower(v)) :
    local.label_value_case == "upper" ? upper(v) : lower(v))
  ]))
```

## 前提知識
- `locals` ブロック: モジュール内で使う名前付きの値を定義する場所です。`local.名前` で参照します。
- `for` 式: `[for v in リスト : 式]` で、リストの各要素を変換した新しいリストを作ります。`{ for k in リスト : k => 値 }` と書くとマップ（キーと値の組）になります。
- 三項演算子: `条件 ? 真のときの値 : 偽のときの値` です。`a == "x"` は比較です。
- `replace(文字列, 正規表現, 置き換え後)`: 正規表現に合う部分を置き換える関数です。`/[^-a-zA-Z0-9]/` は「英数字とハイフン以外の文字」を表します。
- `lower` `upper` `title`: 全部を小文字、全部を大文字、単語の先頭だけを大文字にする関数です。
- `var.xxx` は利用者が渡した入力変数、`local.xxx` は `locals` で作った値を指します。

## 何をしているか
### 1. ラベルとして使う値を 1 つのマップにまとめる
```hcl:line-numbers=76
  string_label_names = ["namespace", "tenant", "environment", "stage", "name"]
  normalized_labels = { for k in local.string_label_names : k =>
    local.input[k] == null ? "" : replace(local.input[k], local.regex_replace_chars, local.replacement)
  }
```

`string_label_names` には、ラベルとして扱う 5 つの名前（namespace、tenant、environment、stage、name）が並んでいます。`for k in local.string_label_names : k => ...` は、その名前ごとに「キーが名前、値が整えた文字列」のマップを作ります。値が `null` のときは空文字に置き換え、そうでなければ `replace` で `regex_replace_chars` に当たる文字を消します。`local.replacement` は既定値の空文字なので、消した文字はそのまま削除されます。

### 2. 大文字小文字の規則を選ぶ
```hcl:line-numbers=82
  formatted_labels = { for k in local.string_label_names : k => local.label_value_case == "none" ? local.normalized_labels[k] :
    local.label_value_case == "title" ? title(lower(local.normalized_labels[k])) :
    local.label_value_case == "upper" ? upper(local.normalized_labels[k]) : lower(local.normalized_labels[k])
  }
```

ここでは `label_value_case` の値によって分岐しています。`none` なら何もせず、`title` なら `title(lower(...))` で「小文字にしてから単語の先頭だけ大文字」にし、`upper` なら `upper`、それ以外（既定は `lower`）は `lower` を使います。三項演算子を縦につなげると、`if` と `else if` の連鎖のように読めます。`for` 式の中で同じ分岐を書くので、名前の値はどの規則でも同じ書き方で処理されます。

### 3. 属性（attributes）も同じ規則で整える
```hcl:line-numbers=87
  attributes = compact(distinct([
    for v in local.normalized_attributes : (local.label_value_case == "none" ? v :
      local.label_value_case == "title" ? title(lower(v)) :
    local.label_value_case == "upper" ? upper(v) : lower(v))
  ]))
```

属性は名前と違って複数の値を持つリストです。まず `normalized_attributes` で文字の置き換えを済ませ、次の `for` 式で 1 要素ずつ大文字小文字を揃えます。最後の `distinct` は同じ値の重複を消し、`compact` は空文字を取り除きます。名前の部分（namespace や stage など）と属性が、同じ規則で処理されることになります。

## ここがすごい
素直に書くなら、規則ごとに `if` 文を並べるか、関数（`function`）を作って呼び出したくなります。しかし Terraform には利用者が関数を定義する機能がないため、このモジュールは同じ分岐を `for` 式の中で書き、規則の追加や変更を一箇所に集めています。

また、`string_label_names` にまとめた名前の一覧を `for` 式で回しているので、ラベルの種類を増やすときは一覧に名前を足すだけで済みます。値の整形と順序（後で `label_order` を使う処理）を分けておくことで、入力の解釈と出力の組み立てが混ざらない構造になっています。

## まとめ
- Terraform の `for` 式と三項演算子だけで、値の変換規則を書けます。
- 「使えない文字を消す」「大文字小文字をそろえる」を、値の種類ごとに同じ書き方で揃えると、読み手が追いやすくなります。
- 名前の一覧（`string_label_names`）を 1 か所に置くと、処理を増やすときの修正箇所が減ります。

