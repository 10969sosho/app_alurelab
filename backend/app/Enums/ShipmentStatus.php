<?php

namespace App\Enums;

enum ShipmentStatus: string
{
    case ALLOCATED = 'allocated';
    case PICKING_UP = 'picking_up';
    case IN_TRANSIT = 'in_transit';
    case DELIVERED = 'delivered';
    case RETURN_TO_SHIPPER = 'return_to_shipper';
    case REJECTED = 'rejected';
}
