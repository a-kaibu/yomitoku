---
title: 別の項目が特定の値のとき、同意のチェックを必須にする
description: Laravel の validateAcceptedIf は、ほかの入力項目が決まった値だったときだけ、この項目に「はい」などの同意が入っているかを確かめます。利用規約への同意のように、条件つきで必要なチェックを、短く書けるようにしています。
language: php
project: Laravel
repo: https://github.com/laravel/framework
license: MIT
copyright: Copyright (c) Taylor Otwell
commit: "b20bf7f442beabdb70e45cf9d29cd6c64675f856"
file: src/Illuminate/Validation/Concerns/ValidatesAttributes.php
lines: [60, 73]
function: validateAcceptedIf
difficulty: 3
format: 2
tags: [防御的プログラミング, 型システム, API設計]
---
## ひとことで

`validateAcceptedIf` は、フォームの入力を検証するルールの 1 つです。`accepted_if:項目,値` と書くと、その項目が指定の値になったときだけ、この項目に同意（「yes」「on」「1」「true」など）が入っていることを求めます。条件に当てはまらなければ、何も求めません。

## コード

```php:line-numbers=60
    public function validateAcceptedIf($attribute, $value, $parameters)
    {
        $acceptable = ['yes', 'on', '1', 1, true, 'true'];

        $this->requireParameterCount(2, $parameters, 'accepted_if');

        [$values, $other] = $this->parseDependentRuleParameters($parameters);

        if (in_array($other, $values, is_bool($other) || is_null($other))) {
            return $this->validateRequired($attribute, $value) && in_array($value, $acceptable, true);
        }

        return true;
    }
```

## 前提知識

- **バリデーション**: 利用者が送った入力が、決まりに合っているかを確かめる仕組みです。合わなければ、エラーのメッセージを返します。
- **同意のチェック**: 「利用規約に同意する」のように、チェックボックスで同意を取る項目のことです。ブラウザからは、オンのとき `on` や `1` などの値が送られます。
- **`in_array`**: 配列の中に、ある値があるかを調べる関数です。第 3 引数の `true` は、型も含めて厳密に比べることを意味します。
- **`is_bool` と `is_null`**: 値が真偽値か、`null` かを調べる関数です。
- **ルールの引数**: `accepted_if:other,value` のように、ルールの後ろに書く値のことです。`parseDependentRuleParameters` が、それを「項目の値」と「比べる値」に分けます。

## 何をしているか

### 1. 許される値の一覧を作る

```php:line-numbers=62
        $acceptable = ['yes', 'on', '1', 1, true, 'true'];
```

`$acceptable = ['yes', 'on', '1', 1, true, 'true'];` で、同意とみなす値を並べています。文字列の `'1'` と数値の `1` の両方を入れているのは、フォームの値と、プログラムから渡された値のどちらにも対応するためです。

### 2. 引数の数を確かめる

```php:line-numbers=64
        $this->requireParameterCount(2, $parameters, 'accepted_if');
```

`requireParameterCount(2, $parameters, 'accepted_if')` で、引数が 2 つ（項目と値）そろっているかを確かめます。足りなければ、ルールの書き方の誤りとして例外が出ます。

### 3. 条件に当てはまるかを見る

```php:line-numbers=66
        [$values, $other] = $this->parseDependentRuleParameters($parameters);

        if (in_array($other, $values, is_bool($other) || is_null($other))) {
```

`parseDependentRuleParameters($parameters)` で、比べる値を取り出します。`in_array($other, $values, is_bool($other) || is_null($other))` で、ほかの項目の値が指定の値と一致するかを見ます。真偽値や `null` のときは、厳密な比べ方を選んでいます。

### 4. 条件が当てはまれば、同意を求める

```php:line-numbers=69
            return $this->validateRequired($attribute, $value) && in_array($value, $acceptable, true);
        }

        return true;
```

一致したときは、`validateRequired` で値が入っているかを確かめ、かつ `in_array($value, $acceptable, true)` で、同意の値かを確かめます。両方を満たしたときだけ `true` になります。一致しなければ、常に `true` を返して、このルールを通します。

## ここがすごい

- 条件がないときは、何も求めずに `true` を返すだけなので、ほかの項目の入力に影響しません。ルールの意味が、「条件つきの必須」として素直に読めます。
- `in_array` の第 3 引数で、比べ方を場面に合わせて切り替えています。真偽値や `null` を、緩い比べ方で誤って一致させない工夫です。
- 同意の値として、文字列と数値と真偽値を並べて持っています。ブラウザからの送信と、プログラムからの指定の両方を、1 つの一覧で受けられます。
- 必須チェックの `validateRequired` を再利用し、同意の値のチェックと組み合わせています。同じ決まりを別の場所に書き直さずに済みます。

## まとめ

`validateAcceptedIf` は、ほかの項目が指定の値のときだけ、同意の入力を必須にする検証ルールです。条件を満たさなければ何もせず、満たしたときは必須かつ同意の値であることを求めます。利用規約の同意のような、条件つきのチェックを、数行の条件分岐で表している点が、この関数の読みどころです。
