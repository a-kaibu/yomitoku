---
title: 同じ URL に許可されているリクエストの種類を調べる
description: Slim の FastRouteDispatcher の getAllowedMethods は、URL に対して使える HTTP メソッドを一覧にします。結果を 1 つ前の URL と比べて覚えておくことで、同じ URL への問い合わせを速くしています。
language: php
project: Slim
repo: https://github.com/slimphp/Slim
license: MIT
copyright: Copyright (c) 2011-2022 Josh Lockhart
commit: "3675bf6baac66b07032575b7bef4200b60b7974b"
file: Slim/Routing/FastRouteDispatcher.php
lines: [92, 115]
function: getAllowedMethods
difficulty: 3
format: 2
tags: [キャッシュ, 探索, API設計]
---
## ひとことで

`getAllowedMethods` は、ある URL に対して許可されている HTTP メソッド（GET や POST など）を、配列にして返す関数です。たとえば `/users` に GET だけが登録されていれば `['GET']` を返します。リクエストのメソッドが合わないときに、405 エラー（Method Not Allowed）の中身として使われます。`RoutingMiddleware` がこの結果を `HttpMethodNotAllowedException` に渡し、エラー処理の段で「使えるメソッド」として表示されます。

## コード

```php:line-numbers=92
    public function getAllowedMethods(string $uri): array
    {
        if ($this->allowedMethodsUri === $uri) {
            return $this->allowedMethods;
        }

        $allowedMethods = [];
        foreach ($this->staticRouteMap as $method => $uriMap) {
            if (isset($uriMap[$uri])) {
                $allowedMethods[$method] = true;
            }
        }

        foreach ($this->variableRouteData as $method => $routeData) {
            $result = $this->dispatchVariableRoute($routeData, $uri);
            if ($result[0] === self::FOUND) {
                $allowedMethods[$method] = true;
            }
        }

        $this->allowedMethodsUri = $uri;

        return $this->allowedMethods = array_keys($allowedMethods);
    }
```

## 前提知識

- **HTTP メソッド**: リクエストの種類を表す言葉です。GET は取得、POST は作成など、用途ごとに使い分けられます。
- **ルーティング**: URL とメソッドの組み合わせに対して、どの処理を呼ぶかを決める仕組みです。
- **FastRoute**: 登録された URL のパターンを、高速に探すためのライブラリです。このクラスは、そのライブラリの上に Slim の仕組みを重ねています。
- **静的ルートと可変ルート**: `/users` のように固定の URL を静的ルート、`/users/{id}` のように一部が変わる URL を可変ルートと呼びます。可変ルートは、パターンに当てはめて照合する必要があります。
- **`Allow` ヘッダー**: 405 Method Not Allowed の応答に付ける、使えるメソッドの一覧です。

## 何をしているか

### 1. 直前の URL と同じなら、覚えた結果を返す

```php:line-numbers=94
        if ($this->allowedMethodsUri === $uri) {
            return $this->allowedMethods;
        }
```

`$this->allowedMethodsUri === $uri` の判定で、前回調べた URL と同じかを確かめます。同じなら、前回の結果 `$this->allowedMethods` をそのまま返します。同じ URL への問い合わせが続く場面では、探索を繰り返さずに済みます。

### 2. 固定の URL を表から探す

```php:line-numbers=98
        $allowedMethods = [];
        foreach ($this->staticRouteMap as $method => $uriMap) {
            if (isset($uriMap[$uri])) {
                $allowedMethods[$method] = true;
            }
        }
```

`$this->staticRouteMap` は、メソッドごとに「URL をキーにした表」を持っています。`isset($uriMap[$uri])` で、その URL が登録されているメソッドを `$allowedMethods` に加えます。

### 3. 変わる URL をパターンで照合する

```php:line-numbers=105
        foreach ($this->variableRouteData as $method => $routeData) {
            $result = $this->dispatchVariableRoute($routeData, $uri);
            if ($result[0] === self::FOUND) {
                $allowedMethods[$method] = true;
            }
        }
```

`$this->variableRouteData` は、メソッドごとに、パターンの情報を持っています。`dispatchVariableRoute` で URL を照合し、結果の最初の値が `self::FOUND` なら、そのメソッドを許可に加えます。

### 4. 結果を覚えて返す

```php:line-numbers=112
        $this->allowedMethodsUri = $uri;

        return $this->allowedMethods = array_keys($allowedMethods);
```

最後に、今回の URL を `$this->allowedMethodsUri` に記録し、メソッド名の一覧を `array_keys` で作って、`$this->allowedMethods` に保存して返します。連想配列のキーにメソッド名を入れてから `array_keys` で取り出すので、同じメソッドが重複しません。

## ここがすごい

- 1 つ前の結果を覚える仕組みは、とても小さな変数 2 つで作られています。一般的なキャッシュのように表を持たず、同じ URL が続く場面だけを速くしています。
- 固定ルートと可変ルートを、別々の表から調べて、最後に 1 つの一覧にまとめています。どちらのルートも漏れなく数えられます。
- メソッド名をキーに使うことで、同じメソッドが複数のルートから見つかっても、一覧には 1 回しか入りません。`true` を値に入れているだけなので、コードは短く保たれています。
- 結果が「見つかったメソッド」だけなので、404 と 405 の区別に使えます。URL が 1 つも見つからなければ空の配列になり、ほかの場所で判断できます。

## まとめ

`getAllowedMethods` は、固定ルートの表と可変ルートの照合を組み合わせて、URL に許されたメソッドの一覧を作ります。直前の URL の結果を覚えておくことで、同じ URL への問い合わせを速くしています。小さな関数ですが、ルーティングが 405 の応答を組み立てる仕組みが、この 1 関数に集まっています。
