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
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
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
        message: 'Difficulty is either: easy, medium, difficult'
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
        message: 'Discount price ({VALUE}) should be below regular price'
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
    //embad guides into tour. take a look at middleware below
    //guides: Array,
    // reffrencing guides document in tourschema
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      adress: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number
      }
    ]
  },
  //enable virtual fileds
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ADD INDEXES to fileds to allow a quicker search
//add 2dsphere index to allow MongoDb to search for geolocation
tourSchema.index({ startLocation: '2dsphere' });

//enabling indexes for the most queried fileds
tourSchema.index({ price: -1 });
tourSchema.index({ slug: 1 });

// virtual propriety; good to output a field from a given filed but nor worthed to be stored in db. by example the duration in weeks from given duration in days. must be decleared as an option object in Schema itself
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//populate the tour with the corespondig reviews using virtual populate method
tourSchema.virtual('reviews', {
  //reffernce the Module you want to get the data from
  ref: 'Review',
  // declair the foreigField, which keeps track of the coresponding field in Reviews Models
  foreignField: 'tour',
  // declair the local field which corespond here in Topur Model to the foreignFiled in Reviews Models
  localField: '_id'

  // then call populate in getTour controller handler with populate('reviews)
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

//EMBAD GUIDES INTO TOURS MODEL. take a look at guides field in Schema,
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tour schema post middleware. here it counts the time between the command to save a document and the time that document is saved
tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
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
