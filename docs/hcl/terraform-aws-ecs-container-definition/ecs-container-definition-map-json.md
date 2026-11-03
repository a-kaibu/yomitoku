---
title: "コンテナ定義の JSON を、マップのまま組み立てる"
description: "terraform-aws-ecs-container-definition のコンテナ定義。多数の設定を 1 つのマップにまとめ、後で null を除いてから jsonencode で JSON にする。"
language: hcl
project: "terraform-aws-ecs-container-definition"
repo: https://github.com/cloudposse/terraform-aws-ecs-container-definition
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "b7bd87e935ead58c7012a5f5d6cbd0db7c170f16"
file: main.tf
lines: [36, 60]
format: 2
function: "locals（container_definition）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
ECS のコンテナ定義は、JSON の中に数十個の項目が並ぶ大きな設定です。このモジュールでは、それらを HCL のマップとして 1 か所に書き、最後に `jsonencode` で JSON に変えます。利用者は、HCL の書き方で項目を指定でき、JSON の形を覚える必要がありません。

## コード
```hcl:line-numbers=36
    name                   = var.container_name
    image                  = var.container_image
    essential              = var.essential
    entryPoint             = var.entrypoint
    command                = var.command
    workingDirectory       = var.working_directory
    readonlyRootFilesystem = var.readonly_root_filesystem
    mountPoints            = var.mount_points
    dnsServers             = var.dns_servers
    dnsSearchDomains       = var.dns_search_domains
    ulimits                = var.ulimits
    repositoryCredentials  = var.repository_credentials
    links                  = var.links
    volumesFrom            = var.volumes_from
    user                   = local.user
    dependsOn              = var.container_depends_on
    privileged             = var.privileged
    portMappings           = var.port_mappings
    healthCheck            = var.healthcheck
    firelensConfiguration  = var.firelens_configuration
    linuxParameters        = var.linux_parameters
    logConfiguration       = local.log_configuration_without_null
    memory                 = var.container_memory
    memoryReservation      = var.container_memory_reservation
    cpu                    = var.container_cpu
```

## 前提知識
- コンテナ定義: コンテナの名前、イメージ、コマンド、ポート、ログなどを、JSON の形で表した設定です。
- マップ（`{ キー = 値 }`）: HCL で、項目の名前と値の組を並べる書き方です。
- `jsonencode`: HCL の値を JSON の文字列に変換する関数です。
- `var.xxx`: 利用者が渡した変数の値です。ここでは、マップの値として使われます。
- `null` の項目: JSON にすると値が `null` として残るので、後で取り除くことがあります。

## 何をしているか
### 1. 名前とイメージは、必ず渡す項目

```hcl:line-numbers=36
    name                   = var.container_name
    image                  = var.container_image
    essential              = var.essential
```

コンテナの名前、イメージ、そして「このコンテナが止まったらタスクも止まるか（essential）」は、基本の項目です。ここでは、利用者の値をそのまま使います。

### 2. 利用者の選択は、ほとんどがそのまま

```hcl:line-numbers=41
    workingDirectory       = var.working_directory
    readonlyRootFilesystem = var.readonly_root_filesystem
    mountPoints            = var.mount_points
    dnsServers             = var.dns_servers
```

多くの項目は、変数をそのまま入れるだけです。JSON のキー名（`readonlyRootFilesystem` など）と、HCL の変数名（`readonly_root_filesystem`）の対応を、この 1 か所で吸収しています。

### 3. 加工が必要な項目は、ローカルの値を使う

```hcl:line-numbers=50
    user                   = local.user
```

`user` は、`firelens_configuration` の有無によって、別の値になります。この判定は別の `locals` で行い、ここでは結果だけを使います。ログの設定も、同じように `local.log_configuration_without_null` を使います。

## ここがすごい
JSON のキー名を、HCL の変数名と並べて書けるので、どの変数がどの JSON の項目になるかが、1 行で追えます。大量の項目を、マップの形で 1 つにまとめる書き方は、この規模のリソースで最も読みやすい方法です。

また、一部の項目だけを `local` に分けて加工しているのも、よい設計です。単純な項目はそのまま、複雑な判定だけを外に出すと、マップ全体の見通しが保たれます。

## まとめ
- 大きな JSON の設定は、HCL のマップで書いて `jsonencode` で変換すると、読みやすく保守しやすくなります。
- キー名の違いは、マップの 1 行ずつで対応を示すと、読み手が追いやすくなります。
- 加工が必要な項目だけ `locals` に分けると、全体の見通しを保てます。
