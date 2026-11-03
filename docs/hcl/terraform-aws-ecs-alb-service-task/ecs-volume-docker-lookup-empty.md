---
title: "ボリュームの追加設定を、lookup の空リストで省く"
description: "terraform-aws-ecs-alb-service-task のタスク定義。docker_volume_configuration が無いボリュームでは lookup の既定の空リストを回し、ブロックを作らない。"
language: hcl
project: "terraform-aws-ecs-alb-service-task"
repo: https://github.com/cloudposse/terraform-aws-ecs-alb-service-task
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "3257ea5cc24eb4f39a3c134828951530b2c3e225"
file: main.tf
lines: [106, 121]
format: 2
function: "resource \"aws_ecs_task_definition\"（dynamic \"volume\"・docker_volume_configuration）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
ECS のタスクには、コンテナ間で共有するボリュームを定義できます。Docker のボリュームには、保存場所や追加の設定があり、すべてのボリュームで必要とは限りません。このコードは、ボリュームごとの追加設定を `lookup` で読み、無ければ空のリストを使って、ブロックを作らないようにしています。

## コード
```hcl:line-numbers=106
  dynamic "volume" {
    for_each = local.volumes
    content {
      host_path = lookup(volume.value, "host_path", null)
      name      = volume.value.name

      dynamic "docker_volume_configuration" {
        for_each = lookup(volume.value, "docker_volume_configuration", [])
        content {
          autoprovision = lookup(docker_volume_configuration.value, "autoprovision", null)
          driver        = lookup(docker_volume_configuration.value, "driver", null)
          driver_opts   = lookup(docker_volume_configuration.value, "driver_opts", null)
          labels        = lookup(docker_volume_configuration.value, "labels", null)
          scope         = lookup(docker_volume_configuration.value, "scope", null)
        }
      }
```

## 前提知識
- ECS のボリューム: タスクの中で、複数のコンテナがファイルを共有するための領域です。
- docker_volume_configuration: Docker が管理するボリュームの設定です。ドライバーや、ラベルなどを持ちます。
- `host_path`: ホストの特定の場所を、ボリュームとして使うときのパスです。
- `lookup(マップ, キー, 既定値)`: キーが無ければ既定値を返します。
- `dynamic` の入れ子: ボリュームの中に、追加設定のブロックを入れ子で作ります。

## 何をしているか
### 1. ボリュームごとに、一覧を回す

```hcl:line-numbers=107
    for_each = local.volumes
```

`local.volumes` は、利用者が定義したボリュームの一覧です。ボリュームの数だけ、`volume` のブロックができます。

### 2. 追加設定は、無ければ空のリストで省く

```hcl:line-numbers=113
        for_each = lookup(volume.value, "docker_volume_configuration", [])
```

ボリュームに `docker_volume_configuration` が無ければ、既定の空のリストを回します。その結果、追加設定のブロックは作られません。書いてあるボリュームだけ、設定が付きます。

### 3. 各項目は、キーが無ければ null

```hcl:line-numbers=115
          autoprovision = lookup(docker_volume_configuration.value, "autoprovision", null)
          driver        = lookup(docker_volume_configuration.value, "driver", null)
          driver_opts   = lookup(docker_volume_configuration.value, "driver_opts", null)
```

各項目は、`lookup` で読み、無ければ `null` にします。ドライバーなどの一部だけを書いても、他の項目はエラーになりません。

## ここがすごい
「ブロックを作るかどうか」を、`lookup` の既定値の空リストで決めている点がよく使われる型です。前に見た `null` の判定と違い、キーの有無だけで判断できるので、マップに項目を足すだけで済みます。

また、ボリュームの種類（host パスや Docker、EFS など）ごとに、入れ子の `dynamic` で必要な設定だけを作っています。1 つのボリュームに、1 種類の設定だけを書けば、余計なブロックは残りません。

## まとめ
- `lookup(マップ, キー, [])` を `for_each` に渡すと、キーが無いときにブロックを作らずに済みます。
- 項目ごとに `lookup` で読むと、部分的な指定に強くなります。
- ボリュームの種類ごとに、入れ子のブロックを分けると、設定の意味が明確になります。
