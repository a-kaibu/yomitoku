---
title: 受け付けるログのレベルを、範囲か一覧で決める
description: Monolog の FilterHandler の setAcceptedLevels は、受け付けるログのレベルを、最小と最大の範囲、または明示した一覧で決めます。範囲は全てのレベルを調べて絞り込み、結果を配列のキーに入れて、後の判定を速くしています。
language: php
project: Monolog
repo: https://github.com/Seldaek/monolog
license: MIT
copyright: Copyright (c) 2011-2020 Jordi Boggiano
commit: "3bed304b1905fed5c30d172872f4d890cbb03c6a"
file: src/Monolog/Handler/FilterHandler.php
lines: [88, 103]
function: setAcceptedLevels
difficulty: 2
format: 2
tags: [データ構造, 型システム, API設計]
---
## ひとことで

`setAcceptedLevels` は、フィルターのハンドラーが受け付けるログのレベルを決める関数です。「WARNING から ERROR まで」のように範囲で指定することも、「ERROR と CRITICAL だけ」のように一覧で指定することもできます。決まったレベルは、後の判定で素早く調べられる形に整えて保存します。

## コード

```php:line-numbers=88
    public function setAcceptedLevels(int|string|Level|array $minLevelOrList = Level::Debug, int|string|Level $maxLevel = Level::Emergency): self
    {
        if (\is_array($minLevelOrList)) {
            $acceptedLevels = array_map(Logger::toMonologLevel(...), $minLevelOrList);
        } else {
            $minLevelOrList = Logger::toMonologLevel($minLevelOrList);
            $maxLevel = Logger::toMonologLevel($maxLevel);
            $acceptedLevels = array_values(array_filter(Level::cases(), fn (Level $level) => $level->value >= $minLevelOrList->value && $level->value <= $maxLevel->value));
        }
        $this->acceptedLevels = [];
        foreach ($acceptedLevels as $level) {
            $this->acceptedLevels[$level->value] = true;
        }

        return $this;
    }
```

## 前提知識

- **ログのレベル**: DEBUG、INFO、WARNING、ERROR などの重要さの段階です。Monolog では、`Level` という列挙型（enum）で表されます。
- **列挙型（enum）**: 決まった候補の中から 1 つを選ぶ型です。`Level::cases()` は、すべての候補を一覧で返します。
- **共用体型（`int|string|Level|array`）**: 引数が複数の型のどれでもよいことを示す書き方です。数値、文字列、列挙型、配列を受け付けます。
- **`array_map` と第一級の呼び出し可能**: `Logger::toMonologLevel(...)` のように、関数名を値として渡して、配列の各要素に適用します。
- **連想配列を集合として使う**: 値を `true` にした連想配列のキーに、レベルの値を入れると、「そのレベルがあるか」を一度の参照で調べられます。

## 何をしているか

### 1. 一覧で渡されたときは、そのまま変換する

```php:line-numbers=90
        if (\is_array($minLevelOrList)) {
            $acceptedLevels = array_map(Logger::toMonologLevel(...), $minLevelOrList);
```

引数が配列なら、`array_map` で、それぞれを `Level` に変換します。`'WARNING'` や `300` のような表記も、同じように扱えます。

### 2. 範囲で渡されたときは、間にあるレベルを集める

```php:line-numbers=92
        } else {
            $minLevelOrList = Logger::toMonologLevel($minLevelOrList);
            $maxLevel = Logger::toMonologLevel($maxLevel);
            $acceptedLevels = array_values(array_filter(Level::cases(), fn (Level $level) => $level->value >= $minLevelOrList->value && $level->value <= $maxLevel->value));
```

範囲のときは、最小と最大をそれぞれ変換します。そのあと、`Level::cases()` のすべてを見て、値が最小以上で最大以下のものだけを残します。`array_values` で、添字を振り直しています。

### 3. 受け付けるレベルを、キーにして保存する

```php:line-numbers=97
        $this->acceptedLevels = [];
        foreach ($acceptedLevels as $level) {
            $this->acceptedLevels[$level->value] = true;
        }
```

保存していた内容を空にしてから、レベルの値をキーにして `true` を入れます。後でログを受け取ったとき、`isset` でキーの有無を見るだけで判定できます。

### 4. 自分自身を返す

```php:line-numbers=102
        return $this;
```

`return $this;` で、呼び出しを続けて書けるようにします。

## ここがすごい

- 範囲と一覧という 2 通りの指定を、1 つの関数で受けています。利用者は、用途に合う書き方を選べます。
- 保存の形を「レベルの値をキーにした集合」にしたので、ログが届くたびに、配列を回して探す必要がありません。判定は、キーの存在を確かめるだけで済みます。
- 範囲の判定を、列挙型の全候補から組み立てています。新しいレベルが増えても、範囲の計算は自動的に正しく動きます。
- 保存の前に空にするので、何度呼び出しても、前の設定が混ざりません。設定を上書きする動きが、明確になっています。

## まとめ

`setAcceptedLevels` は、受け付けるログのレベルを、範囲か一覧で指定し、判定しやすい集合として保存する関数です。引数の型を柔軟にしつつ、保存の形を単純に保っています。ログを振り分ける仕組みの、設定の入口となる関数です。
