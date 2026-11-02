---
title: テンプレートの親子関係をたどって、ブロックの順番を作る
description: Twig の BlockChain の resolveLineage は、テンプレートが継承している親をたどり、子から親へ並んだ一覧を作ります。同じテンプレートを二度たどる循環を見つけると、例外で止めます。
language: php
project: Twig
repo: https://github.com/twigphp/Twig
license: BSD-3-Clause
copyright: Copyright (c) 2009-present by the Twig Team.
commit: "beb4b229784425ceb6514cec9c573b3e42b30703"
file: src/BlockChain.php
lines: [190, 217]
function: resolveLineage
difficulty: 3
format: 2
tags: [再帰, データ構造, エラー処理]
---
## ひとことで

`resolveLineage` は、Twig のテンプレートが `extends` で継承している親を、子から順にたどって一覧にする関数です。その一覧を使うと、子が上書きしたブロックを、どの親まで見て探せばよいかが分かります。途中で同じテンプレートに戻ってしまう循環は、例外で見つけます。

## コード

```php:line-numbers=190
    private function resolveLineage(array $context): array
    {
        $lineage = [];
        $fixed = true;

        foreach ($this->templates as $template) {
            if ($template instanceof self) {
                $lineage[] = $template;
                continue;
            }

            $seen = [];
            do {
                if (isset($seen[$id = spl_object_id($template)])) {
                    throw new \LogicException(\sprintf('Circular template inheritance detected while building a block chain from "%s".', $template->getTemplateName()));
                }
                $seen[$id] = true;
                $lineage[] = $template;

                $parent = $template->getParent($context);
                $fixed = $fixed && $template->hasFixedParent();

                $template = $parent;
            } while (false !== $template);
        }

        return [$lineage, $fixed];
    }
```

## 前提知識

- **テンプレートの継承**: Twig では、子のテンプレートが `{% extends %}` で親を指定します。子は親のブロック（`{% block %}`）を上書きでき、描画されるのは、最終的な内容です。
- **ブロックの鎖**: ある名前のブロックを探すとき、子から親へ順に見ていく並びです。一番手前の定義が優先されます。
- **`getParent`**: テンプレートの親を、文脈に応じて返すメソッドです。親が決まらないときは `false` を返します。
- **`spl_object_id`**: オブジェクトを、同じ実体ごとに区別できる整数の番号にする関数です。同じ実体なら、同じ番号になります。
- **`do ... while`**: 処理を少なくとも 1 回行ってから、条件を見て繰り返す書き方です。

## 何をしているか

### 1. 指定された各テンプレートについて、親をたどる

```php:line-numbers=195
        foreach ($this->templates as $template) {
            if ($template instanceof self) {
                $lineage[] = $template;
                continue;
            }
```

外側の `foreach` は、`$this->templates` の要素を 1 つずつ見ます。要素が `self`（この `BlockChain` のインスタンス）なら、すでに鎖になっているものとして、そのまま一覧に加えて次へ進みます。そうでなければ、テンプレートとして親を順にたどる処理を始めます。

### 2. 同じテンプレートに戻ったら例外

```php:line-numbers=202
            do {
                if (isset($seen[$id = spl_object_id($template)])) {
                    throw new \LogicException(\sprintf('Circular template inheritance detected while building a block chain from "%s".', $template->getTemplateName()));
                }
                $seen[$id] = true;
                $lineage[] = $template;
```

`do ... while` の中で、`spl_object_id($template)` を `$seen` に記録します。すでに同じ番号があれば、親の鎖が輪になっているので、`LogicException` を投げます。例外のメッセージには、テンプレート名を入れています。

### 3. 親をたどり、固定かどうかを確かめる

```php:line-numbers=209
                $parent = $template->getParent($context);
                $fixed = $fixed && $template->hasFixedParent();
```

テンプレートを一覧に加えたあと、`$template->getParent($context)` で親を得ます。`$fixed` は、ここまでのすべてのテンプレートで、親が固定かどうかを表します。`hasFixedParent()` が `true` のものだけなら、`$fixed` は `true` のままです。

### 4. 一覧と固定の情報を返す

```php:line-numbers=213
            } while (false !== $template);
        }

        return [$lineage, $fixed];
```

親がなくなると `$template` が `false` になり、`while` が終わります。最後に、テンプレートの一覧と `$fixed` を組にして返します。

## ここがすごい

- 循環の検出を、テンプレートのオブジェクトの番号で行っています。テンプレート名の文字列比べでは、同じ名前の別物を区別できませんが、この方法ならオブジェクトそのものを比べられます。
- 親の一覧を作るときに、「親が固定か」を同時に計算しています。後の処理は、この一覧をもとに、親の決め方が変わらないかを判断できます。
- 中に別の `BlockChain` が入っている場合は、その鎖を作り直さず、そのまま一覧に加えます。鎖を組み合わせるとき、同じ継承を何度もたどる無駄を避けられます。
- 例外のメッセージに、どのテンプレートから循環が始まったかを入れています。利用者が、どの継承を直せばよいかを見つけやすい作りです。

## まとめ

`resolveLineage` は、子から親へテンプレートの継承をたどり、ブロックを探すための一覧を作る関数です。`spl_object_id` で訪れた先を覚え、輪になったら例外で止めます。継承という関係を、単純な一覧に変換しながら、安全に進める仕組みが、この短い関数に表れています。
