طلب جديد - باف بلازا
=====================================

رقم الطلب: {{ $orderNumber }}
الرمز: {{ $offerCode }}
التاريخ: {{ $date }}

--- معلومات الزبون ---
الاسم: {{ $customerName }}
الهاتف: {{ $customerPhone }}
الإمارة: {{ $state }}
العنوان: {{ $address }}
وضع الزبون: {{ $customerStatus }}

--- تفاصيل الطلب ---
المنتج: {{ $productName }} × {{ $quantity }}
@if(!empty($promoCode))
كود الخصم: {{ $promoCode }}
مبلغ الخصم على البضاعة: {{ $promoDiscount }} د.إ
@endif
القيمة الكلية: {{ $total }} د.إ
عمولة المسوق: {{ $marketerFee }} د.إ

@if($notes && $notes !== '-')
--- ملاحظات ---
{{ $notes }}
@endif

باف بلازا
