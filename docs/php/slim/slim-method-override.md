---
title: HTML フォームからでも PUT や DELETE を送れるようにする
description: Slim の MethodOverrideMiddleware は、HTML フォームが POST しか送れない制約を、ヘッダーや隠しフィールドの値で補います。送られたメソッド名を読み取って、リクエストのメソッドを書き換えてから次の処理へ渡します。
language: php
project: Slim
repo: https://github.com/slimphp/Slim
license: MIT
copyright: Copyright (c) 2011-2022 Josh Lockhart
commit: "3675bf6baac66b07032575b7bef4200b60b7974b"
file: Slim/Middleware/MethodOverrideMiddleware.php
lines: [24, 43]
function: process
difficulty: 2
format: 2
tags: [API設計, ネットワーク, 防御的プログラミング]
---
## ひとことで

`process` は、HTTP リクエストのメソッドを、別の方法で指定されたものに書き換えてから、次の処理へ渡すミドルウェアの中心部分です。HTML フォームは GET と POST しか送れないので、PUT や DELETE を使いたいときに、`X-Http-Method-Override` ヘッダーか、隠しフィールドの `_METHOD` の値を使います。

## コード

```php:line-numbers=24
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $methodHeader = $request->getHeaderLine('X-Http-Method-Override');

        if ($methodHeader) {
            $request = $request->withMethod($methodHeader);
        } elseif (strtoupper($request->getMethod()) === 'POST') {
            $body = $request->getParsedBody();

            if (is_array($body) && !empty($body['_METHOD']) && is_string($body['_METHOD'])) {
                $request = $request->withMethod($body['_METHOD']);
            }

            if ($request->getBody()->eof()) {
                $request->getBody()->rewind();
            }
        }

        return $handler->handle($request);
    }
```

## 前提知識

- **HTTP メソッド**: リクエストの種類を表す言葉です。GET は取得、POST は送信、PUT は更新、DELETE は削除に使われます。
- **HTML フォームの制約**: 標準の HTML フォームは、`method` 属性に GET か POST しか指定できません。そのため、REST の API で PUT や DELETE を使うには、工夫が必要です。
- **メソッドオーバーライド**: 本来のメソッドを、別の場所（ヘッダーや本文）に書いて伝える方法です。サーバーは、それを読んで本来のメソッドとして扱います。
- **PSR-7 のリクエスト**: `withMethod` や `getParsedBody` などのメソッドを持つ、変更できないリクエストの型です。変更は、新しいリクエストを作って返す形で行われます。
- **`eof` と `rewind`**: ストリームを最後まで読んだかを調べるメソッドと、読み取り位置を先頭に戻すメソッドです。

## 何をしているか

### 1. ヘッダーを優先して読む

```php:line-numbers=26
        $methodHeader = $request->getHeaderLine('X-Http-Method-Override');
```

`X-Http-Method-Override` ヘッダーの値を取り出します。値があれば、それを新しいメソッドとして `withMethod` でリクエストを作り直します。ヘッダーは、API の利用者がプログラムから指定するときに便利です。

### 2. POST なら、本文の _METHOD を読む

```php:line-numbers=30
        } elseif (strtoupper($request->getMethod()) === 'POST') {
            $body = $request->getParsedBody();

            if (is_array($body) && !empty($body['_METHOD']) && is_string($body['_METHOD'])) {
                $request = $request->withMethod($body['_METHOD']);
            }
```

ヘッダーがなく、メソッドが POST のときは、解析済みの本文から `_METHOD` を探します。文字列であれば、それを新しいメソッドにします。HTML フォームで、隠しフィールドに `_METHOD` を入れるのが典型的な使い方です。

### 3. 本文の読み取り位置を戻す

```php:line-numbers=37
            if ($request->getBody()->eof()) {
                $request->getBody()->rewind();
            }
```

本文を読み終えていたら、読み取り位置を先頭に戻します。後の処理が、本文を読めるようにするためです。

### 4. 次の処理へ渡す

```php:line-numbers=42
        return $handler->handle($request);
```

書き換えたリクエストを、`$handler->handle` で次の処理へ渡します。書き換えが無ければ、元のリクエストがそのまま渡されます。

## ここがすごい

- 書き換えが必要なときだけ `withMethod` を呼びます。普通の GET や POST のリクエストは、元のまま通り抜けます。
- ヘッダーを先に見て、なければ本文を見るという順番で、2 つの方法を 1 つの関数で扱っています。API の利用者とフォームの利用者の両方に対応できます。
- 本文を読んだあとで `rewind` を呼んでいるので、後の処理が本文を読めなくなる問題を防いでいます。細かいけれど、実際に起きやすい落とし穴への配慮です。
- リクエストを変更せず、新しいリクエストを作って渡しています。PSR-7 の決まりに従っているので、前後のミドルウェアの処理と衝突しません。

## まとめ

`process` は、ヘッダーか隠しフィールドで指定されたメソッドを読み取り、リクエストのメソッドを書き換えてから次へ渡すミドルウェアです。HTML フォームの制約を、サーバーの側で補う仕組みになっています。小さなコードの中に、本文の読み直しという細かな配慮も含まれている点が、この関数の読みどころです。
