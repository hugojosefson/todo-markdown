/**
 * Returns a new array with the elements of the given array interspersed with the given separator.
 * @param array the array to intersperse
 * @param separator the separator to intersperse with
 */
export function intersperse<
  Base,
  ArrayElement extends Base = Base,
  Separator extends Base = Base,
>(
  array: ArrayElement[],
  separator: Separator,
): Base[] {
  return array.flatMap((element: ArrayElement, index: number) => {
    if (index === 0) {
      return [element];
    }
    return [separator, element];
  });
}
