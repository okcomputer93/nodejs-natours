const Tour = require('../models/tourModel');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = async (req, res) => {
    try {
        console.log(req.query);
        // Build query
        // 1A) Filtering
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // 1B) Advanced Filtering
        // Manually mongodb
        // { difficulty: 'easy', duration: {$gte: 5} }
        let queryStr = JSON.stringify(queryObj);
        // replace: gte, gt, lte, lt
        queryStr = queryStr.replace(
            /\b(gt|gte|lt|lte)\b/g,
            (match) => `$${match}`
        );

        let query = Tour.find(JSON.parse(queryStr));
        // 2) Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // 3) Field limiting
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        // 4) Pagination
        const page = +req.query.page || 1;
        const limit = +req.query.limit || 100;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);

        if (req.query.page) {
            const totalTours = await Tour.countDocuments();
            if (skip >= totalTours) throw new Error('This page does not exist');
        }

        // Execute query
        const tours = await query;

        // Send response
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours,
            },
        });

        // const query = await Tour.find()
        //     .where('duration')
        //     .equals('5')
        //     .where('difficulty')
        //     .equals('easy');
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error.message,
        });
    }
};

exports.getTour = async (req, res) => {
    try {
        // db.tours.findOne({ _id: req.params.id })
        const tour = await Tour.findById(req.params.id);
        res.status(200).json({
            status: 'success',
            results: tour.length,
            data: {
                tour,
            },
        });
    } catch (error) {
        res.status(404).json({
            status: 'fail',
            message: error,
        });
    }
};

exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error,
        });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            status: 'success',
            data: {
                tour,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: 'Invalid data',
        });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findOneAndDelete(req.params.id);
        res.status(200).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            data: 'Invalid data',
        });
    }
};
