# Eval Point Balancer

The Eval Point Balancer system makes sure the evaluation point economy is working as intended, by trimming excess points from users who have more than the maximum allowed, and by modifying the pool to achieve a desired average points per user in the economy. This is done by listening to Scale Team Update webhooks, and by running a weekly job to balance the economy.
