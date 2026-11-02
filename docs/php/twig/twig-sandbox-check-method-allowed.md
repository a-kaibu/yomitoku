---
title: テンプレートから呼べるメソッドを、許可リストで絞る
description: Twig のサンドボックスは、テンプレートから呼び出してよいメソッドを許可リストで制限します。許可されていない呼び出しは、例外で止める仕組みです。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/Sandbox/SecurityPolicy.php
lines: [147, 167]
function: SecurityPolicy::checkMethodAllowed
difficulty: 2
format: 2
tags: [セキュリティ, 防御的プログラミング, 設計パターン]
---

## ひとことで

`checkMethodAllowed` は、Twig の **サンドボックス**（安全のために機能を制限する仕組み）で、テンプレートが **オブジェクトのどのメソッドを呼べるか** を確かめる関数です。利用者が書いたテンプレートから、危ない処理が呼ばれないようにします。

## コード

```php:line-numbers=147
    public function checkMethodAllowed($obj, $method): void
    {
        $method = strtolower($method);

        if ($obj instanceof Template || ($obj instanceof Markup && 'withcontent' !== $method)) {
            return;
        }

        $allowed = false;
        foreach ($this->allowedMethods as $class => $methods) {
            if ($obj instanceof $class && \in_array($method, $methods, true)) {
                $allowed = true;
                break;
            }
        }

        if (!$allowed) {
            $class = $obj::class;
            throw new SecurityNotAllowedMethodError(\sprintf('Calling "%s" method on a "%s" object is not allowed.', $method, $class), $class, $method);
        }
    }
```

## 前提知識

- **サンドボックス**: 信頼できないコードを、決められた範囲の中だけで動かす仕組みです。
- **許可リスト**: 「ここに書いたものだけ許す」という一覧です。書かれていないものは、すべて禁止になります。
- **メソッド名の小文字化**: PHP のメソッド名は大文字小文字を区別しないので、`strtolower` でそろえて比べます。
- **`instanceof`**: オブジェクトが特定のクラスに属するかを調べる演算子です。
- **`SecurityNotAllowedMethodError`**: 許可されていないメソッドを呼んだときの専用のエラーです。

## 何をしているか

### 1. メソッド名を小文字にそろえる

```php:line-numbers=149
        $method = strtolower($method);
```

PHP のメソッド名は大文字小文字を区別しません。`strtolower` で小文字にして、許可リストと比べやすくします。

### 2. テンプレート自身と、特別な Markup は通す

```php:line-numbers=151
        if ($obj instanceof Template || ($obj instanceof Markup && 'withcontent' !== $method)) {
            return;
        }
```

テンプレート（`Template`）のメソッドは、常に許可されます。`Markup` のメソッドも通しますが、`withContent` だけは例外で、許可リストで確かめます。

### 3. 許可リストに、そのクラスとメソッドがあるか調べる

```php:line-numbers=155
        $allowed = false;
        foreach ($this->allowedMethods as $class => $methods) {
            if ($obj instanceof $class && \in_array($method, $methods, true)) {
                $allowed = true;
                break;
            }
        }
```

`$this->allowedMethods` は「クラス名 → 許可されたメソッドの一覧」です。オブジェクトがそのクラスの一員で、メソッド名が一覧に入っていれば、許可します。

### 4. 許可されていなければ、例外を投げる

```php:line-numbers=163
        if (!$allowed) {
            $class = $obj::class;
            throw new SecurityNotAllowedMethodError(\sprintf('Calling "%s" method on a "%s" object is not allowed.', $method, $class), $class, $method);
        }
```

どの許可にも当たらなければ、`SecurityNotAllowedMethodError` を投げます。エラーには、呼ぼうとしたメソッド名とクラス名が入るので、原因を特定できます。

## ここがすごい

### 「全部禁止」から始めて、必要なものだけ許す

許可リストは、禁止リストより安全です。新しいメソッドが増えても、リストに書かれていなければ自動的に禁止になるからです。この関数は、既定で「許可しない」を選んでいます。

### 例外的な通し方を、限定している

テンプレートのオブジェクトや、`Markup` の多くのメソッドは、特別に通しています。そのうえで `withContent` だけは確かめる、という例外の書き方です。例外は必要な範囲だけに限り、安全性を守っています。

### 失敗の理由を、エラーに詰めている

エラーには、メソッド名やクラス名が含まれます。利用者はどこを直せばよいかがすぐわかります。セキュリティの仕組みでも、原因がわかる形で報告することが大切です。

## まとめ

- 安全のための制限は、「許可したものだけ通す」の形にすると、新しい危険に強い。
- メソッド名は大文字小文字を無視して比べると、呼び出しの抜け道を防げる。
- 例外的に通すものは、限られた場所だけにすると安全性を保ちやすい。
- エラーには原因が分かる情報を含めると、利用者が直しやすい。
