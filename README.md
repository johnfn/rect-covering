# Rect Covering

Defines a shape which can be any arbitrary polygon drawn with straight lines.

Defines two functions:

* **addRect** - Add a rectangular area to the shape.
* **subtractRect** - Remove a rectangular area from the shape.

And provides the following:

* **.cover** - One way to fully cover the polygon with rectangles.
* **.getOutlines()** A list of the outlines of the shape. There can potentially be many if the shape has holes or if there are multiple shapes.

The point being:

* Test if the shape contains a point in O(n)
* Get outlines in O(n)
* Add/subtractRect in O(1)

Where `n` is the number of times `addRect`/`subtractRect` is called. 
