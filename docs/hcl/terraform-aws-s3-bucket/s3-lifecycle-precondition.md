---
title: "lifecycle の precondition で作れない組み合わせを止める"
description: "terraform-aws-s3-bucket の lifecycle ブロック。ディレクトリバケットでは使えない file_systems を、フィルタで黙って消すのではなく、precondition でエラーにする書き方。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [108, 114]
format: 2
function: "resource \"aws_s3_bucket\"（lifecycle precondition）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
`lifecycle` ブロックの中の `precondition` は、リソースを作る前に条件を確かめ、満たさなければエラーで止めるための仕組みです。このモジュールでは、ディレクトリバケットに `file_systems` を指定した場合、黙って無視せずにエラーで知らせます。

## コード
::: code-group

```hcl:line-numbers=108 [日本語訳]
  lifecycle {
    # 項目を黙って捨てるのではなく、エラーで理由を知らせる（フィルタで捨てると気づけない）
    precondition {
      condition     = length(var.file_systems) == 0
      error_message = "S3 Files is not supported on a directory bucket, so file_systems must be empty when is_directory_bucket is true."
    }
  }
```

```hcl:line-numbers=108 [原文]
  lifecycle {
    # Saying so beats dropping the entries silently, which is what filtering them out would do
    precondition {
      condition     = length(var.file_systems) == 0
      error_message = "S3 Files is not supported on a directory bucket, so file_systems must be empty when is_directory_bucket is true."
    }
  }
```

:::

## 前提知識
- `lifecycle` ブロック: リソースの作り方や置き換え方を決めるブロックです。`create_before_destroy` などを書きます。
- `precondition` ブロック: リソースを作る前に満たすべき条件を書きます。`condition` が真なら進み、偽ならエラーになります。
- `error_message`: エラーのときに表示される文章です。
- `length(リスト) == 0`: リストが空かどうかを判定する式です。
- `is_directory_bucket`: ディレクトリバケットとして作るかどうかを表す変数です。ディレクトリバケットは、通常の S3 バケットとは異なる種類のバケットです。

## 何をしているか
### 1. 組み合わせの条件を書く
```hcl:line-numbers=110
    precondition {
      condition     = length(var.file_systems) == 0
```

`condition` は、`file_systems` が空であることを求めています。空でなければ、条件が偽になり、Terraform は計画を進めずに止まります。`precondition` は、リソースを作る直前に評価されるので、誤った入力がそのまま AWS に送られることを防げます。

### 2. 利用者に理由を伝える
```hcl:line-numbers=112
      error_message = "S3 Files is not supported on a directory bucket, so file_systems must be empty when is_directory_bucket is true."
```

`error_message` には、「S3 Files はディレクトリバケットでは使えないので、is_directory_bucket が真のときは file_systems を空にしてください」という趣旨の文章を書きます。読み手は、エラーを見ただけで何を直せばよいかが分かります。

## ここがすごい
コメントにあるように、「項目をフィルタで黙って捨てる」ほうが、書く量は少なく見えます。しかし、そうすると利用者は自分の指定が効いていないことに気づけません。このモジュールは、誤った組み合わせを正直に止め、設定の意図と実際の動作がずれないようにしています。

また、`precondition` はリソースの `lifecycle` に書くので、条件とリソースの定義が近くにあります。読み手は、どの条件でどのリソースが作られないかを、同じ場所で確かめられます。

## まとめ
- `precondition` を使うと、作る前に入力の組み合わせを確かめられます。
- 無効な指定を黙って捨てるより、エラーで知らせるほうが、利用者の誤解を防げます。
- `error_message` に対処の方法を書くと、利用者がすぐに直せます。

