const rewire = require('rewire');
const paymentsModule = rewire('../src/payments.js');

const mockStripe = {
    charges: {
        create: jasmine.createSpy('create').and.callFake((params) => {
            if (params.source === 'tok_invalid') {
                return Promise.reject(new Error("Invalid source token"));
            }
            return Promise.resolve({
                id: 'ch_12345',
                amount: params.amount,
                currency: 'usd',
                status: 'succeeded'
            });
        })
    }
};

const mockDb = {
    run: jasmine.createSpy('run').and.callFake((query, params, callback) => {
        if (params.includes('duplicate_payment_id')) {
            callback(null, { lastID: 1, changes: 1 });
        } else {
            callback(new Error("Database error")); // Simulating database error
        }
    }),
    get: jasmine.createSpy('get').and.callFake((query, params, callback) => {
        if (params[0] === 'duplicate_payment_id') {
            callback(null, { id: 1 }); // Simulate existing transaction
        } else {
            callback(null, null); // Simulate no existing transaction
        }
    })
};

paymentsModule.__set__({
    stripe: mockStripe,
    db: mockDb
});

describe("Stripe Payment Processing", () => {
    beforeEach(() => {
        mockStripe.charges.create.calls.reset();
        mockDb.run.calls.reset();
        mockDb.get.calls.reset();
    });

    it("should process a Stripe payment successfully", async () => {
      const uniquePaymentId = `payment_${new Date().getTime()}`; // Ensure unique ID for each test
      const req = {
          body: {
              amount: 5000,
              source: 'tok_visa',
              seller_account: 'seller@example.com',
              patron_account: 'patron@example.com',
              payment_id: uniquePaymentId
          }
      };
      const res = {
          writeHead: jasmine.createSpy('writeHead'),
          end: jasmine.createSpy('end')
      };

      await paymentsModule.__get__('processStripePayment')(req, res);

      expect(mockStripe.charges.create).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(500, jasmine.any(Object));
      expect(res.end).toHaveBeenCalledWith(jasmine.any(String));
      const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
      expect(responseArg.success).toBeFalse();
  });

    it("should return an error for invalid payment amounts", async () => {
        const req = {
            body: {
                amount: -500, // Invalid amount
                source: 'tok_visa',
                seller_account: 'seller@example.com',
                patron_account: 'patron@example.com',
                payment_id: 'payment_123'
            }
        };
        const res = {
            writeHead: jasmine.createSpy('writeHead'),
            end: jasmine.createSpy('end')
        };

        await paymentsModule.__get__('processStripePayment')(req, res);

        expect(res.writeHead).toHaveBeenCalledWith(400, jasmine.any(Object));
        expect(res.end).toHaveBeenCalledWith(jasmine.any(String));
        const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
        expect(responseArg.success).toBeFalse();
        expect(responseArg.message).toContain("Invalid payment amount");
    });

    it("should handle Stripe service errors", async () => {
        mockStripe.charges.create.and.callFake(() => Promise.reject(new Error("Stripe payment processing failed.")));
        const uniquePaymentId = `payment_${new Date().getTime()}`;

        const req = {
            body: {
                amount: 500,
                source: 'tok_invalid', // Triggering the error
                seller_account: 'seller@example.com',
                patron_account: 'patron@example.com',
                payment_id: uniquePaymentId
            }
        };
        const res = {
            writeHead: jasmine.createSpy('writeHead'),
            end: jasmine.createSpy('end')
        };

        await paymentsModule.__get__('processStripePayment')(req, res);

        expect(mockStripe.charges.create).toHaveBeenCalled();
        expect(res.writeHead).toHaveBeenCalledWith(500, jasmine.any(Object));
        expect(res.end).toHaveBeenCalledWith(jasmine.any(String));
        const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
        expect(responseArg.success).toBeFalse();
        expect(responseArg.message).toContain("Stripe payment processing failed.");
    });

    it("should return an error if required request fields are missing", async () => {
        const req = {
            body: {
                // Missing 'amount', 'source', and 'payment_id'
                seller_account: 'seller@example.com',
                patron_account: 'patron@example.com',
            }
        };
        const res = {
            writeHead: jasmine.createSpy('writeHead'),
            end: jasmine.createSpy('end')
        };

        await paymentsModule.__get__('processStripePayment')(req, res);

        expect(res        .writeHead).toHaveBeenCalledWith(400, jasmine.any(Object));
        const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
        expect(responseArg.success).toBeFalse();
        expect(responseArg.message).toContain("Missing required fields");
    });

    it("should not process a Stripe payment if the payment ID already exists", async () => {
        // Simulate an existing transaction
        mockDb.get.and.callFake((query, params, callback) => {
            if (params[0] === 'payment_123') {
                callback(null, { id: 1 }); // Simulate existing transaction
            } else {
                callback(null, null); // Simulate no existing transaction
            }
        });

        const req = {
            body: {
                amount: 500,
                source: 'tok_visa',
                seller_account: 'seller@example.com',
                patron_account: 'patron@example.com',
                payment_id: 'payment_123'
            }
        };
        const res = {
            writeHead: jasmine.createSpy('writeHead'),
            end: jasmine.createSpy('end')
        };

        await paymentsModule.__get__('processStripePayment')(req, res);

        expect(mockDb.get).toHaveBeenCalled();
        expect(mockStripe.charges.create).not.toHaveBeenCalled();
        expect(res.writeHead).toHaveBeenCalledWith(409, jasmine.any(Object));
        const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
        expect(responseArg.success).toBeFalse();
        expect(responseArg.message).toContain("Transaction with this payment ID already exists.");
    });

    it("should handle database errors when logging a Stripe transaction", async () => {
        // Force a database error
        mockDb.run.and.callFake((query, params, callback) => {
            callback(new Error("Stripe payment processing failed."));
        });

        const req = {
            body: {
                amount: 500,
                source: 'tok_visa',
                seller_account: 'seller@example.com',
                patron_account: 'patron@example.com',
                payment_id: 'payment_123'
            }
        };
        const res = {
            writeHead: jasmine.createSpy('writeHead'),
            end: jasmine.createSpy('end')
        };

        await paymentsModule.__get__('processStripePayment')(req, res);

        expect(mockDb.run).toHaveBeenCalled();
        expect(res.writeHead).toHaveBeenCalledWith(500, jasmine.any(Object));
        const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
        expect(responseArg.success).toBeFalse();
        expect(responseArg.message).toContain("Stripe payment processing failed.");
    });

    it("should return an error if Stripe rejects the payment source", async () => {
        mockStripe.charges.create.and.callFake(() => Promise.reject(new Error("Stripe payment processing failed.")));

        const req = {
            body: {
                amount: 500,
                source: 'tok_invalid', // Invalid source
                seller_account: 'seller@example.com',
                patron_account: 'patron@example.com',
                payment_id: 'payment_123'
            }
        };
        const res = {
            writeHead: jasmine.createSpy('writeHead'),
            end: jasmine.createSpy('end')
        };

        await paymentsModule.__get__('processStripePayment')(req, res);

        expect(mockStripe.charges.create).toHaveBeenCalled();
        expect(res.writeHead).toHaveBeenCalledWith(500, jasmine.any(Object));
        const responseArg = JSON.parse(res.end.calls.mostRecent().args[0]);
        expect(responseArg.success).toBeFalse();
        expect(responseArg.message).toContain("Stripe payment processing failed.");
    });
});

