//require mongoose
const mongoose = require('mongoose');
const slugify = require('slugify');

//tour Schema
const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less or equal then 40 characters'
      ],
      minlength: [
        10,
        'A tour name must have more or equal then 10 characters'
      ]
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message:
          'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date]
    // secretTour: {
    //   type: Boolean,
    //   default: false
    // }
  },
  //enable virtual fileds
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual propriety; good to output a field from a given filed but nor worthed to be stored in db. by example the duration in weeks from given duration in days. must be decleared as an option object in Schema itself
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// mongoose pre - save middleawre to be runned before saving. add a slug
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// MIDDLEAWRE STACK MONGOOSE

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tour schema post middleware. here it counts the time between the command to save a document and the time that docuemnt is saved
tourSchema.post(/^find/, function(docs, next) {
  console.log(
    `Query took ${Date.now() - this.start} milliseconds!`
  );
  next();
});

// AGGREGATION MIDDLEWARE
// don't send secret tour to client
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } }
  });

  console.log(this.pipeline());
  next();
});
// tour model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
