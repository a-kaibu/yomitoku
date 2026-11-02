---
title: 関数の戻り値を、テンプレートとして描き直す
description: mustache.php の resolveValue は、変数の値が呼び出せる関数だったとき、その関数を実行します。返された文字列がさらに Mustache のテンプレートとして描画されるので、データの中に書き方の決まりを持たせられます。
language: php
project: mustache.php
repo: https://github.com/bobthecow/mustache.php
license: MIT
copyright: Copyright (c) 2010-2026 Justin Hileman
commit: "c33d74b6dc5b83b6cecd23583b4085d1f4e25332"
file: src/Template.php
lines: [219, 238]
function: resolveValue
difficulty: 3
format: 2
tags: [クロージャ, 遅延評価, 再帰]
---
## ひとことで

`resolveValue` は、テンプレートに差し込もうとしている値が「呼び出せる関数（ラムダ）」だった場合に、その関数を実行して結果を返す関数です。返された結果が文字列なら、それを Mustache のテンプレートとしてもう一度描画します。

## コード

```php:line-numbers=219
    protected function resolveValue($value, Context $context)
    {
        if (!$this->lambdas) {
            return $value;
        }

        if (($this->strictCallables ? is_object($value) : !is_string($value)) && is_callable($value)) {
            $result = call_user_func($value);

            if (is_string($result)) {
                return $this->mustache
                    ->loadLambda($result)
                    ->renderInternal($context);
            }

            return $result;
        }

        return $value;
    }
```

## 前提知識

- **ラムダ（Mustache の仕様）**: 値として関数を渡し、描画のときに実行させる仕組みです。Mustache の仕様では、関数が返した文字列も、テンプレートとして描画されることがあります。
- **`is_callable`**: 値が関数として呼び出せるかを調べる関数です。文字列の関数名、無名関数、`[$object, 'method']` の配列などが対象になります。
- **`call_user_func`**: 呼び出せるものを、引数なしで実行する関数です。
- **描画のコンテキスト**: テンプレートの中で、今どの変数のデータを使えるかを表すものです。`Context` は、データを重ねて持つ入れ物です。
- **`strictCallables` と `lambdas`**: このクラスのプロパティで、ラムダを使うかどうか、文字列を呼び出し対象として扱うかどうかを決めます。

## 何をしているか

### 1. ラムダを使わないなら、そのまま返す

```php:line-numbers=221
        if (!$this->lambdas) {
            return $value;
        }
```

`if (!$this->lambdas)` で、ラムダの機能が無効なら、値をそのまま返します。ほとんどのテンプレートでは、この早い戻りだけで済みます。

### 2. 呼び出せる値かを確かめる

```php:line-numbers=225
        if (($this->strictCallables ? is_object($value) : !is_string($value)) && is_callable($value)) {
```

`$this->strictCallables` が `true` なら、`is_object($value)` で、オブジェクトだけを呼び出し対象にします。`false` のときは、`!is_string($value)` で、文字列以外を対象にします。文字列を関数名として呼ばないように、この条件で守っています。さらに `is_callable($value)` で、本当に呼び出せるかを確かめます。

### 3. 関数を実行し、文字列なら描き直す

```php:line-numbers=226
            $result = call_user_func($value);

            if (is_string($result)) {
                return $this->mustache
                    ->loadLambda($result)
                    ->renderInternal($context);
            }

            return $result;
```

条件を満たすと、`call_user_func($value)` で関数を実行します。戻り値が文字列なら、`$this->mustache->loadLambda($result)` でテンプレートとして読み込み、`renderInternal($context)` で、今の文脈のまま描画します。文字列でなければ、その値をそのまま返します。

### 4. それ以外はそのまま返す

```php:line-numbers=237
        return $value;
```

関数でない値は、最後の `return $value;` で、変更せずに返されます。

## ここがすごい

- 「関数を実行する」と「返った文字列をテンプレートとして描く」を、1 つの関数で扱っています。利用者は、テンプレートの中に書き方を埋め込む関数を渡すだけで済みます。
- 文字列を関数名として呼ばない条件を、`strictCallables` で切り替えられるようにしています。文字列を呼べると、安全でない関数が実行される恐れがあるので、その判断を設定に残しています。
- 結果を描き直すときに、今の `$context` をそのまま渡しています。関数の中で使ったデータと、描き直しの中で使うデータがずれません。
- 早い戻り（`if (!$this->lambdas)`）によって、通常の変数の描画には余計な処理を増やしていません。よく使われる経路が、短く保たれています。

## まとめ

`resolveValue` は、値が呼び出せる関数なら実行し、返った文字列をテンプレートとして描画し直す関数です。呼び出してよい値を、設定とチェックの 2 段階で絞っています。関数の戻り値をさらに描画できる、という Mustache のラムダの仕様が、この数行に収まっています。
