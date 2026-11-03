---
title: "日付の連続した一覧を数列から作る"
description: "dbt-utils の date_spine。開始日から終了日まで、指定した単位で連続する日付の表を作る。整数の数列を作り、そこに日数を足して日付にしている。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/date_spine.sql
lines: [42, 63]
function: "default__date_spine"
difficulty: 2
tags: [日時, アルゴリズム]
format: 2
---

## ひとことで

`date_spine` は、ある開始日から終了日までの日付を、一列に並べた表を作るマクロです。日付そのものを増やすのではなく、0 から始まる整数の数列を作り、その数だけ日付を進めることで連続した日付を作ります。

## コード

```sql:line-numbers=42
with rawdata as (

    {{dbt_utils.generate_series(
        dbt_utils.get_intervals_between(start_date, end_date, datepart)
    )}}

),

all_periods as (

    select (
        {{
            dbt.dateadd(
                datepart,
                "row_number() over (order by generated_number) - 1",
                start_date
            )
        }}
    ) as date_{{datepart}}
    from rawdata

),
```

## 前提知識

- **日付の一覧（date spine）**: 売上の日別集計などで、データのない日も含めて欠けなく並べた日付の表。
- **Common Table Expression（`WITH` 句）**: 途中の結果に名前を付けて、次の段階で使う書き方。
- **`row_number() over (order by …)`**: 並び順に従って 1 から番号を付ける窓関数。
- **`dateadd`**: 日付に、指定した単位の数を足す dbt のマクロ。
- **`where` による打ち切り**: 終了日を超えた行を取り除く条件。

## 何をしているか

### 1. 数列から行を作る

`rawdata` は、`generate_series` のマクロで整数の数列を並べた表です。日数の数だけ行ができます。

```sql:line-numbers=42
with rawdata as (

    {{dbt_utils.generate_series(
        dbt_utils.get_intervals_between(start_date, end_date, datepart)
    )}}
```

数列の行数は、`get_intervals_between` で開始日と終了日の差から求めます。

### 2. 数列の番号を日付に変える

`all_periods` では、`row_number() − 1` で 0 から始まる番号を作り、それを開始日に足します。

```sql:line-numbers=50
all_periods as (

    select (
        {{
            dbt.dateadd(
                datepart,
                "row_number() over (order by generated_number) - 1",
                start_date
            )
        }}
    ) as date_{{datepart}}
    from rawdata

),
```

`row_number() over (order by generated_number) - 1` は、最初の行を 0、次の行を 1 と数え直します。開始日に、その数を足すことで、1 行ずつ次の日付になります。

### 3. 終了日を超えたものを外す

最後に、終了日より後の日付を `where` で取り除きます。（この部分は、数列の長さが少し多くても正しい範囲に収めるための処理です。）

## ここがすごい

- **日付を直接ではなく数で作る**: 日付の型や区切りの違いを気にせず、整数の数列と 1 つの足し算で連続した日付ができます。
- **データのない日を埋める**: 売上の表と左結合すると、件数が 0 の日も欠けずに並べられます。
- **マクロの分担**: 数列の作り方、日数の計算、日付の足し算を別のマクロに分けているので、データベースごとの差は小さな部品に閉じ込められています。
- **トレードオフ**: 期間が長すぎると、行数が多くなります。日単位で何十年分も作ると、表が大きくなることを意識する必要があります。

## まとめ

- 連続した日付は、数列を作ってから日付の足し算をすると簡単に作れる。
- `row_number()` で 0 から数えると、開始日からの日数としてそのまま使える。
- 日付の欠けを埋めたいときは、この一覧を基準の表として使うとよい。
