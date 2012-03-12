/**
 * Minimal spatial index for ray tracing.
 *
 * Suitable for a scale of 1 numerical unit == 1 metre, and with a resolution
 * of 1 millimetre. (Implementation uses fixed tolerances)
 *
 * Constant.
 *
 * @implementation
 * A crude State pattern: typed by isBranch field to be either a branch
 * or leaf cell.
 *
 * Octree: axis-aligned, cubical. Subcells are numbered thusly:
 *            110---111
 *            /|    /|
 *         010---011 |
 *    y z   | 100-|-101
 *    |/    |/    | /
 *    .-x  000---001
 *
 * Each cell stores its bound (fatter data, but simpler code).
 *
 * Calculations for building and tracing are absolute rather than incremental --
 * so quite numerically solid. Uses tolerances in: bounding triangles (in
 * Triangle.bound), and checking intersection is inside cell (both effective
 * for axis-aligned items). Also, depth is constrained to an absolute subcell
 * size (easy way to handle overlapping items).
 *
 * @invariants
 * * bound is an Object of two Vector3
 *   * bound.lower <= bound.upper
 *   * bound encompasses the cell's contents
 * * isBranch is a Boolean
 * * subParts is:
 *    if isBranch
 *       an Array, length == 8, elements are SpatialIndex or null
 *    else
 *       an Array, elements are Triangle
 */


// uses: Math, Vector3, Triangle




"use strict";




/// constructor ----------------------------------------------------------------

/**
 * Construct a SpatialIndex.
 *
 * Construct basic object and prepare to set fields, before delegating to
 * main internal constructor.
 *
 * overloaded params:
 * public:
 * @param  eyePosition [Vector3]         position of eye point
 * @param  items       [Array[Triangle]] items to be indexed
 * private:
 * @param  bound       [Object[Vector3,Vector3]] lower and upper corners
 * @param  items       [Array[Triangle]]         items to be indexed
 * @param  level       [integer]                 depth in the tree
 *
 * @return [SpatialIndex]
 */
var SpatialIndex =
   function()
{
   var items = arguments[1];

   // public construction, with: eyePosition, items
   if( 2 === arguments.length )
   {
      var eyePosition = arguments[0];

      // make rectilinear bound
      {
         // include eye position --  simplifies intersection algorithm
         var rectBound = { lower: eyePosition, upper: eyePosition };
         // accommodate all items
         for( var i = items.length, rb = rectBound;  i-- > 0; )
         {
            // expand to fit item
            var ib = items[i].bound();
            rb.lower = clamp( rb.lower, -Infinity, ib.lower );
            rb.upper = clamp( rb.upper, ib.upper,  Infinity );
         }
      }

      // make cubical upper bound
      {
         // find max dimension
         var maxSize = Math.max.apply( null,
            sub( rectBound.upper, rectBound.lower ));
         // set all dimensions to max
         var cubeUpper = add( rectBound.lower, Vector3(maxSize) );
         // prevent any numerical slippage
         cubeUpper = clamp( cubeUpper, rectBound.upper, cubeUpper );
      }

      // make cubical bound
      var bound = { lower: rectBound.lower, upper: cubeUpper };
      var level = 0;
   }
   // private construction, with: bound, items, level
   else
   {
      var bound = arguments[0];
      var level = arguments[2];
   }

   // make subcell tree, with main (recursive) constructor
   this.construct_( bound, items, level );


/* DEBUG */
document.writeln( 'SpatialIndex: ' + this );
document.writeln( 'bound: lo '    + this.bound.lower + " up " + this.bound.upper );
document.writeln( 'isBranch: ' + this.isBranch );
document.writeln( 'subParts: ' + this.subParts[0].vertexs[0] + " " + this.subParts[0].vertexs[1] + " " + this.subParts[0].vertexs[2] );
};




/// queries --------------------------------------------------------------------

/**
 * Find nearest intersection of ray with item.
 *
 * @query
 *
 * @param  rayOrigin    [Vector3]  ray start point
 * @param  rayDirection [Vector3]  ray direction (unitized)
 * @param  lastHit      [Triangle] previous item intersected
 *
 * @return [Object[Triangle,Vector3]|null] hit object and position, or null
 */
SpatialIndex.prototype.intersection =
   function( rayOrigin, rayDirection, lastHit )
{
   // (fake polymorphism for the State pattern)
   return this.isBranch ?
      this.intersectBranch_( rayOrigin, rayDirection, lastHit, arguments[3] ) :
      this.intersectLeaf_( rayOrigin, rayDirection, lastHit );
};




/// implementation /////////////////////////////////////////////////////////////

/// constants

// accommodates scene including sun and earth, down to cm cells (use 47 for mm)
SpatialIndex.MAX_LEVELS_ = 44;

// 8 seemed reasonably optimal in casual testing
SpatialIndex.MAX_ITEMS_  =  8;


/**
 * Main recursive constructor.
 *
 * Set all object fields: isBranch, bound, subParts.
 *
 * @command
 *
 * @param  bound [Object[Vector3,Vector3]] lower and upper corners
 * @param  items [Array[Triangle]]         items remaining to insert
 * @param  level [integer]                 depth in the tree
 */
SpatialIndex.prototype.construct_ =
   function( bound, items, level )
{
   this.bound = bound;

   // is branch if items overflow leaf and tree not too deep
   this.isBranch = (items.length > SpatialIndex.MAX_ITEMS_) &&
      (level < (SpatialIndex.MAX_LEVELS_ - 1));

   // make branch: make subcells, and recurse construction
   if( this.isBranch )
   {
      // make subcells
      this.subParts = new Array( 8 );
      for( var s = 0, q = 0;  s < subParts.length;  ++s )
      {
         // make subcell bound
         var subBound = { lower: Vector3(0), upper: Vector3(0) };
         for( var b = 0, c = (s & 1);  b < 3;  ++b, c = (s >> b) & 1 )
         {
            var mid = (bound.lower[b] + bound.upper[b]) * 0.5;
            subBound.lower[b] = c ? mid[b] : bound.lower[b];
            subBound.upper[b] = c ? bound.upper[b] : mid[b];
         }

         // collect items that overlap subcell
         var subItems = [];
         for( var i = 0;  i < items.length;  ++i )
         {
            // must overlap in all dimensions
            var itemBound = items[i].bound();
            for( var b = 0, isOverlap = true;  b < 3;  ++b )
            {
               isOverlap &= (itemBound.upper[b] >= subBound.lower[b]) &&
                  (itemBound.lower[b] < subBound.upper[b]);
            }

            if( isOverlap ) subItems.push( items[i] );
         }

         // decide next level, curtailing degenerate subdivision
         // (setting next level to max will make next recursion end)
         // (degenerate if two or more subcells copy entire contents of parent,
         // or if subdivision reaches below mm size)
         // (having a model including the sun requires one subcell copying
         // entire contents of parent to be allowed)
         if( subItems.length === items.length ) ++q;
         var subLevel = ((q > 1) || ((subBound.upper[0] - subBound.lower[0]) <
            (TOLERANCE * 4))) ? SpatialIndex.MAX_LEVELS_ : level + 1;

         // recurse, if any overlapping subitems
         this.subParts[s] = subItems.length ?
            new SpatialIndex( subBound, subItems, subLevel ) : null;
      }
   }
   // make leaf: store items, and end recursion
   else
   {
      this.subParts = items;
   }
};


/**
 * Find nearest intersection of ray with branch.
 *
 * @query
 *
 * @param  rayOrigin    [Vector3]       ray start point
 * @param  rayDirection [Vector3]       ray direction (unitized)
 * @param  lastHit      [Triangle]      previous item intersected
 * @param  cellPosition [Vector3|falsy] walk-point, or falsy
 *
 * @return [Object[Triangle,Vector3]|null] hit object and position, or null
 */
SpatialIndex.prototype.intersectBranch_ =
   function( rayOrigin, rayDirection, lastHit, cellPosition )
{
   var midPoint = scale( 0.5, add( this.bound.lower, this.bound.upper ) );

   // first call has no walk-point
   cellPosition = cellPosition || rayOrigin;

   // find which subcell holds walk-point
   var subCell = 0;
   for( var i = 3;  i--;  subCell |= ((cellPosition[i] >= midPoint[i]) << i) );

   // walk, along ray, through intersected subcells
   // (cellPosition and subCell are the iterators)
   for( ; ; )
   {
      // maybe recurse into subcell, and maybe exit branch if item was hit
      if( this.subParts[subCell] )
      {
         var hit = this.subParts[subCell].intersection(
            rayOrigin, rayDirection, lastHit, cellPosition );

         if( hit ) return hit;
      }

      // find next subcell ray moves to
      // (find which face of corner ahead is crossed first)
      var axis = 2;
      var step = new Array(3);
      for( var i = 3;  i-- > 0;  axis = (step[i] < step[axis]) ? i : axis )
      {
         // find which face (inter-/outer-) the ray is heading for (in this
         // dimension)
         var high = (subCell >> i) & 1;
         var face = (rayDirection[i] < 0) ^ high ?
            this.bound[high ? 'upper' : 'lower'][i] : midPoint[i];
         // calculate distance to face
         // (div by zero produces infinity, which is later discarded)
         step[i] = (face - rayOrigin[i]) / rayDirection[i];
         // last clause of for-statement notes nearest so far
      }

      // leaving branch if: direction is negative and subcell is low,
      // or direction is positive and subcell is high
      if( ((subCell >> axis) & 1) ^ (rayDirection[axis] < 0) ) return null;

      // move to (outer face of) next subcell
      cellPosition = add( rayOrigin, scale( step[axis], rayDirection ) );
      subCell      = subCell ^ (1 << axis);
   }
};


/**
 * Find nearest intersection of ray with leaf.
 *
 * @query
 *
 * @param  rayOrigin    [Vector3]  ray start point
 * @param  rayDirection [Vector3]  ray direction (unitized)
 * @param  lastHit      [Triangle] previous item intersected
 *
 * @return [Object[Triangle,Vector3]|null] hit object and position, or null
 */
SpatialIndex.prototype.intersectLeaf_ =
   function( rayOrigin, rayDirection, lastHit )
{
   // results
   var hitObject   = null;
   var hitPosition = null;

   var boundLow = this.bound.lower;
   var boundUpp = this.bound.upper;

   // test all items in leaf
   for( var i = this.subParts.length, nearest = Number.MAX_VALUE;  i-- > 0; )
   //for( item in this.subParts )   // better ?
   {
      var item = this.subParts[i];

      // avoid spurious intersection with surface just come from
      if( item !== lastHit )
      {
         // intersect ray with item, and inspect if nearest so far
         var distance = item.intersection( rayOrigin, rayDirection );
         if( distance && (distance < nearest) )
         {
            // check intersection is inside cell bound (with tolerance)
            var hit = add(rayOrigin, scale(distance, rayDirection));
            var t   = TOLERANCE;
            if( (boundLow[0] - hit[0] <= t) && (hit[0] - boundUpp[0] <= t) &&
                (boundLow[1] - hit[1] <= t) && (hit[1] - boundUpp[1] <= t) &&
                (boundLow[2] - hit[2] <= t) && (hit[2] - boundUpp[2] <= t) )
            {
               // note nearest so far
               hitObject   = item;
               hitPosition = hit;
               nearest     = distance;
            }
         }
      }
   }

   // check there was a hit
   //return hitObject ? { object: hitObject, position: hitPosition } : null;
   return hitObject ? [ hitObject, hitPosition ] : null;
};
