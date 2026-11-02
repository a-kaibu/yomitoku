---
title: 同じ値どうしを束ねて、入れ子のグループを作る
description: Laravel の Collection::groupBy は、項目を指定したキーの値ごとに分けて、グループの連想配列を作ります。複数のキーを配列で渡すと、入れ子のグループにもできます。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "4bfe20a39407f383ce7c6090c820abd847e9eeb6"
file: src/Illuminate/Collections/Collection.php
lines: [540, 582]
function: Collection::groupBy
difficulty: 3
format: 2
tags: [データ構造, 関数型, アルゴリズム]
---

## ひとことで

`groupBy` は、データを **ある項目の値ごとに束ねる** 関数です。たとえば「地域」の項目で分ければ、地域ごとのユーザー一覧ができます。レポートの集計や、画面の見出しごとの表示に使われます。

## コード

```php:line-numbers=540
    public function groupBy($groupBy, $preserveKeys = false)
    {
        if (! $this->useAsCallable($groupBy) && is_array($groupBy)) {
            $nextGroups = $groupBy;

            $groupBy = array_shift($nextGroups);
        }

        $groupBy = $this->valueRetriever($groupBy);

        $results = [];

        foreach ($this->items as $key => $value) {
            $groupKeys = $groupBy($value, $key);

            if (! is_array($groupKeys)) {
                $groupKeys = [$groupKeys];
            }

            foreach ($groupKeys as $groupKey) {
                $groupKey = match (true) {
                    is_bool($groupKey) => (int) $groupKey,
                    $groupKey instanceof \UnitEnum => enum_value($groupKey),
                    $groupKey instanceof \Stringable, is_null($groupKey) => (string) $groupKey,
                    default => $groupKey,
                };

                if (! array_key_exists($groupKey, $results)) {
                    $results[$groupKey] = $this->newInstance();
                }

                $results[$groupKey]->offsetSet($preserveKeys ? $key : null, $value);
            }
        }

        $result = $this->newInstance($results);

        if (! empty($nextGroups)) {
            return $result->map->groupBy($nextGroups, $preserveKeys);
        }

        return $result;
    }
```

## 前提知識

- **グループ化**: 同じ値をもつ項目どうしをまとめることです。SQL の `GROUP BY` と同じ考え方です。
- **`valueRetriever`**: 項目から値を取り出す方法を、文字列のキーでも関数でも扱えるようにする仕組みです。
- **`match (true)`**: 条件を順に確かめて、最初に当てはまったものの値を返す PHP の書き方です。
- **`UnitEnum`**: PHP の列挙型（enum）の共通の型です。
- **`newInstance`**: 同じ種類のコレクションを、新しい中身で作るメソッドです。

## 何をしているか

### 1. 分ける基準を、関数として用意する

```php:line-numbers=542
        if (! $this->useAsCallable($groupBy) && is_array($groupBy)) {
            $nextGroups = $groupBy;

            $groupBy = array_shift($nextGroups);
        }

        $groupBy = $this->valueRetriever($groupBy);
```

`$groupBy` が配列なら、最初の要素を今の基準にして、残りを次の段階の基準として取っておきます。そのうえで `valueRetriever` で、基準を「項目から値を取り出す関数」にそろえます。

### 2. 各項目について、グループのキーを求める

```php:line-numbers=550
        $results = [];

        foreach ($this->items as $key => $value) {
            $groupKeys = $groupBy($value, $key);

            if (! is_array($groupKeys)) {
                $groupKeys = [$groupKeys];
            }
```

それぞれの項目について、グループのキーを求めます。キーが 1 つでなく配列で返されたときは、1 項目を複数のグループに入れられます。

### 3. キーの型をそろえて、グループに入れる

```php:line-numbers=559
            foreach ($groupKeys as $groupKey) {
                $groupKey = match (true) {
                    is_bool($groupKey) => (int) $groupKey,
                    $groupKey instanceof \UnitEnum => enum_value($groupKey),
                    $groupKey instanceof \Stringable, is_null($groupKey) => (string) $groupKey,
                    default => $groupKey,
                };

                if (! array_key_exists($groupKey, $results)) {
                    $results[$groupKey] = $this->newInstance();
                }

                $results[$groupKey]->offsetSet($preserveKeys ? $key : null, $value);
            }
```

`match (true)` で、キーを扱いやすい形に直します。真偽値は 0 か 1 に、列挙型は値に、`null` や文字列にできるものは文字列にします。そのキーのグループがまだなければ作り、項目を入れます。

### 4. 次の段階があれば、再帰的にまとめる

```php:line-numbers=575
        $result = $this->newInstance($results);

        if (! empty($nextGroups)) {
            return $result->map->groupBy($nextGroups, $preserveKeys);
        }

        return $result;
```

残りの基準（`$nextGroups`）があれば、各グループに対して `groupBy` を再び呼びます。`$result->map->groupBy(...)` は、グループごとにこの処理を行う書き方です。

具体例として `[['city' => 'Tokyo', 'age' => 20], ['city' => 'Osaka', 'age' => 30]]` を `city` で分けると、`Tokyo` と `Osaka` の 2 つのグループができます。

## ここがすごい

### 基準を配列にすると、入れ子が 1 行で書ける

グループを 2 段階で分けたいとき、普通は手で 2 重のループを書きます。この関数は、基準を配列で渡すだけで、同じ処理を各グループに再帰的にかけます。呼び出し側は、`['region', 'city']` と書くだけです。

### 型の違いを、キーにする前に吸収している

真偽値や列挙型のような値は、そのままでは配列のキーにできません。`match (true)` で、キーとして使える形に直してから、グループに入れています。キーの扱いを 1 か所に集めることで、利用者は型の心配をせずに済みます。

### 項目が複数のグループに入ることもある

キーが配列で返された場合は、同じ項目を複数のグループに入れます。タグで分類する、といった使い方に対応できる設計です。

## まとめ

- 同じ値どうしを束ねるには、キーごとにグループを作って項目を入れていく。
- 段階的な分類は、基準を配列にして、各グループに同じ処理を再帰的にかけると簡潔になる。
- キーとして使えない値は、事前にそろえてから使うと安全。
- 項目が複数の組に入れる設計にすると、タグのような分類にも対応できる。
