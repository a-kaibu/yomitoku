---
title: フィルターを優先度順に回し、入れ子の呼び出しにも耐える
description: WordPress の WP_Hook::apply_filters は、登録されたフィルターを優先度の小さい順に実行し、値を次々に変えていきます。フィルターの中でさらに同じフィルターが呼ばれても壊れない仕組みが見どころです。
language: php
project: WordPress
repo: https://github.com/WordPress/WordPress
license: GPL-2.0-or-later
copyright: Copyright 2011-2026 by the contributors
commit: "f73030e78d1af6c13f70a8825d0484d49230197a"
file: wp-includes/class-wp-hook.php
lines: [339, 382]
function: WP_Hook::apply_filters
difficulty: 3
format: 2
tags: [設計パターン, イテレータ, API設計]
---

## ひとことで

`apply_filters` は、WordPress の「フィルター」を実行する中心の関数です。投稿の本文や URL のような値を、登録された関数たちが **順番に書き換えていく** 仕組みを支えています。優先度の数字で実行順を決めます。

## コード

::: code-group

```php:line-numbers=339 [日本語訳]
	public function apply_filters( $value, $args ) {
		if ( ! $this->callbacks ) {
			return $value;
		}

		$nesting_level = $this->nesting_level++;

		$this->iterations[ $nesting_level ] = $this->priorities;

		$num_args = count( $args );

		do {
			$priority = current( $this->iterations[ $nesting_level ] );

			if ( false === $priority ) {
								// 優先度が 1 つ以上でコールバックがあるはずなので、通常ここには来ない。
				break;
			}

			$this->current_priority[ $nesting_level ] = $priority;

			foreach ( $this->callbacks[ $priority ] as $the_ ) {
				if ( ! $this->doing_action ) {
					$args[0] = $value;
				}

								// 可能なら array_slice() を使わずに済ませる。
				if ( 0 === $the_['accepted_args'] ) {
					$value = call_user_func( $the_['function'] );
				} elseif ( $the_['accepted_args'] >= $num_args ) {
					$value = call_user_func_array( $the_['function'], $args );
				} else {
					$value = call_user_func_array( $the_['function'], array_slice( $args, 0, $the_['accepted_args'] ) );
				}
			}
		} while ( false !== next( $this->iterations[ $nesting_level ] ) );

		unset( $this->iterations[ $nesting_level ] );
		unset( $this->current_priority[ $nesting_level ] );

		--$this->nesting_level;

		return $value;
	}
```

```php:line-numbers=339 [原文]
	public function apply_filters( $value, $args ) {
		if ( ! $this->callbacks ) {
			return $value;
		}

		$nesting_level = $this->nesting_level++;

		$this->iterations[ $nesting_level ] = $this->priorities;

		$num_args = count( $args );

		do {
			$priority = current( $this->iterations[ $nesting_level ] );

			if ( false === $priority ) {
				// This is not expected to occur since the hook is known to have callbacks at one or more priorities.
				break;
			}

			$this->current_priority[ $nesting_level ] = $priority;

			foreach ( $this->callbacks[ $priority ] as $the_ ) {
				if ( ! $this->doing_action ) {
					$args[0] = $value;
				}

				// Avoid the array_slice() if possible.
				if ( 0 === $the_['accepted_args'] ) {
					$value = call_user_func( $the_['function'] );
				} elseif ( $the_['accepted_args'] >= $num_args ) {
					$value = call_user_func_array( $the_['function'], $args );
				} else {
					$value = call_user_func_array( $the_['function'], array_slice( $args, 0, $the_['accepted_args'] ) );
				}
			}
		} while ( false !== next( $this->iterations[ $nesting_level ] ) );

		unset( $this->iterations[ $nesting_level ] );
		unset( $this->current_priority[ $nesting_level ] );

		--$this->nesting_level;

		return $value;
	}
```

:::

## 前提知識

- **フック（フィルター）**: 「この値を通る前に、ほかの関数で加工させてもらう」という拡張の仕組みです。関数を登録しておくと、WordPress が必要な場所で呼んでくれます。
- **優先度**: フィルターの実行順を決める数字です。小さいほど先に実行されます。
- **`current()` / `next()`**: 配列の「今見ている位置」を動かす PHP の関数です。`foreach` と違い、位置を手で進めます。
- **`call_user_func_array`**: 関数名と引数の配列を渡して、関数を呼ぶ関数です。
- **`do ... while`**: 先に 1 回実行してから、条件を確かめて繰り返す書き方です。

## 何をしているか

### 1. 入れ子の呼び出しに備えて、階層を 1 つ増やす

```php:line-numbers=340
		if ( ! $this->callbacks ) {
			return $value;
		}

		$nesting_level = $this->nesting_level++;

		$this->iterations[ $nesting_level ] = $this->priorities;
```

フィルターの中で、同じフックの `apply_filters` がもう一度呼ばれることがあります。そのため `$this->nesting_level++` で「今の階層」を取り出して増やします。優先度の一覧 `$this->priorities` は、階層ごとの `$this->iterations[$nesting_level]` にコピーして保存します。こうすると、内側の呼び出しが外側の位置を壊さずに済みます。

### 2. 優先度を 1 つずつ見て、コールバックを順に呼ぶ

::: code-group

```php:line-numbers=350 [日本語訳]
		do {
			$priority = current( $this->iterations[ $nesting_level ] );

			if ( false === $priority ) {
								// 優先度が 1 つ以上でコールバックがあるはずなので、通常ここには来ない。
				break;
			}

			$this->current_priority[ $nesting_level ] = $priority;

			foreach ( $this->callbacks[ $priority ] as $the_ ) {
				if ( ! $this->doing_action ) {
					$args[0] = $value;
				}

								// 可能なら array_slice() を使わずに済ませる。
				if ( 0 === $the_['accepted_args'] ) {
					$value = call_user_func( $the_['function'] );
				} elseif ( $the_['accepted_args'] >= $num_args ) {
					$value = call_user_func_array( $the_['function'], $args );
				} else {
					$value = call_user_func_array( $the_['function'], array_slice( $args, 0, $the_['accepted_args'] ) );
				}
			}
```

```php:line-numbers=350 [原文]
		do {
			$priority = current( $this->iterations[ $nesting_level ] );

			if ( false === $priority ) {
				// This is not expected to occur since the hook is known to have callbacks at one or more priorities.
				break;
			}

			$this->current_priority[ $nesting_level ] = $priority;

			foreach ( $this->callbacks[ $priority ] as $the_ ) {
				if ( ! $this->doing_action ) {
					$args[0] = $value;
				}

				// Avoid the array_slice() if possible.
				if ( 0 === $the_['accepted_args'] ) {
					$value = call_user_func( $the_['function'] );
				} elseif ( $the_['accepted_args'] >= $num_args ) {
					$value = call_user_func_array( $the_['function'], $args );
				} else {
					$value = call_user_func_array( $the_['function'], array_slice( $args, 0, $the_['accepted_args'] ) );
				}
			}
```

:::

`current()` で今の優先度を取り出し、その優先度に登録された関数を順に呼びます。`accepted_args` は、関数が受け取る引数の数です。0 なら引数なし、引数の数以上ならそのまま、少ないなら `array_slice` で必要なぶんだけ渡します。

フィルターの値は、関数の戻り値で上書きされます。`$value = call_user_func_array(...)` の行が、値を次の関数へ渡すリレーの役割をしています。

### 3. 次の優先度へ進み、後始末をする

```php:line-numbers=374
		} while ( false !== next( $this->iterations[ $nesting_level ] ) );

		unset( $this->iterations[ $nesting_level ] );
		unset( $this->current_priority[ $nesting_level ] );

		--$this->nesting_level;

		return $value;
```

`next()` が `false` を返すまで繰り返します。最後に、階層の記録（`iterations`、`current_priority`）を消して、`--$this->nesting_level` で階層を 1 つ戻します。

## ここがすごい

### 入れ子の呼び出しを、階層ごとの記録で支えている

フィルターの中でまた同じフックを使うのは、珍しいことではありません。もし「今どの優先度まで進んだか」を 1 つの変数だけで持っていたら、内側の呼び出しが外側の位置を書き換えてしまいます。この関数は、階層ごとに `iterations` の配列を分けて持つことで、この衝突を防いでいます。

### 配列の位置を `current` と `next` で動かす

`foreach` ではなく `current` と `next` で位置を動かすのは、実行の途中で配列が変わったときに対応するためです。`remove_filter` のような別の処理が、実行中にフィルターを消しても、位置を見直せる仕組みになっています。

### `doing_action` で、アクションとフィルターを 1 つの関数にまとめている

```php:line-numbers=361
				if ( ! $this->doing_action ) {
					$args[0] = $value;
				}
```

`doing_action` が偽のとき（フィルターとして動くとき）だけ、最初の引数を最新の値にそろえます。アクションでは値を返さないので、この 1 行の条件で両方を兼ねています。

## まとめ

- フィルターの入れ子は、階層ごとに位置の記録を分けると安全に扱える。
- 配列の位置を `current` と `next` で動かすと、途中で変わる配列にも対応しやすい。
- 引数の数を `accepted_args` で制限すると、関数ごとに必要な分だけ渡せる。
- 1 つの関数で「値を変えるフィルター」と「値を返さないアクション」を兼ねられる。
