---
title: "検証のドメイン名を、指定が無ければマップのキーで補う"
description: "terraform-aws-acm の validation_option。domain_name が省略されたとき、for_each のマップのキーをドメイン名として使う。"
language: hcl
project: "terraform-aws-acm"
repo: https://github.com/terraform-aws-modules/terraform-aws-acm
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d461daf01f5d11bf116b82cdd9680a29772eb8f7"
file: main.tf
lines: [36, 42]
format: 2
function: "dynamic \"validation_option\"（try によるドメイン名の補完）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
ACM の検証オプションは、ドメインごとに書きます。ドメイン名を書く欄が省略できるように、このモジュールはマップのキーをドメイン名として使えるようにしています。`try` が、その補い方を一行で決めています。

## コード
```hcl:line-numbers=36
    for_each = var.validation_option

    content {
      domain_name       = try(validation_option.value["domain_name"], validation_option.key)
      validation_domain = validation_option.value["validation_domain"]
    }
  }
```

## 前提知識
- `for_each` にマップを渡すと、キーと値の組を一つずつ取り出せます。`validation_option.key` はキーです。
- `try(式, 代わりの値)`: 式がエラーになれば、代わりの値を返します。
- `validation_domain`: 検証に使うドメインです。ワイルドカードの元となるドメインを指定します。

## 何をしているか
### 1. マップの要素ごとにブロックを作る

```hcl:line-numbers=36
    for_each = var.validation_option
```

`var.validation_option` のマップの要素の数だけ、ブロックが作られます。

### 2. ドメイン名を、指定か既定のキーから決める

```hcl:line-numbers=39
      domain_name       = try(validation_option.value["domain_name"], validation_option.key)
```

`domain_name` の指定があればその値を、無ければキーを使います。キーにドメイン名を書いておけば、`domain_name` を省けます。

### 3. 検証のドメインは、必ず指定する

```hcl:line-numbers=40
      validation_domain = validation_option.value["validation_domain"]
```

`validation_domain` は、`try` を使わずに直接読みます。省略を許さない項目として、扱いを分けています。

## ここがすごい
キーを名前として使うと、利用者は同じ情報を二度書かずに済みます。省略できる項目と、必ず必要な項目を、`try` の有無で区別している点も読みどころです。

## まとめ
- `for_each` のキーは、既定の名前として再利用できます。
- 省略できる項目は `try` で、必須の項目は直接読むと、設計の意図が伝わります。
- 同じ情報を二度書かせない設計は、利用者の入力を減らします。
